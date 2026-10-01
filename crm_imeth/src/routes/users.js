const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authorize, authenticate } = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/mailer');
const { validateHierarchyAssignment, validateBulkHierarchyAssignment } = require('../utils/hierarchyValidation');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// Helper to calculate SHA-256 hash for OTP codes
function hashOtp(otpCode) {
  return crypto.createHash('sha256').update(String(otpCode).trim()).digest('hex');
}

// GET: Fetch current authenticated user profile
router.get('/me', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        phone: true,
        bio: true,
        avatar: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

// POST: User Provisioning - Create Team Lead or Sales Agent account with auto temp password
// Admins can create TEAM_LEAD and AGENT; Team Leads can ONLY create AGENT
router.post('/', authorize(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const currentUserRole = req.user?.role;
    const { name, email, role, password, customPassword } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'Email and role are required' });
    }

    // Role-Based Access Control (RBAC) Validation
    if (currentUserRole === 'TEAM_LEAD') {
      if (role !== 'AGENT') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Team Leads can only create Sales Agents',
        });
      }
    } else if (currentUserRole === 'ADMIN') {
      if (!['TEAM_LEAD', 'AGENT'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Forbidden: Administrators cannot create other Administrator accounts. Only Super Admins can manage Administrators.',
        });
      }
    } else if (currentUserRole === 'SUPER_ADMIN') {
      // Super Admins can create any role
      if (!['ADMIN', 'TEAM_LEAD', 'AGENT'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user role specified',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient privileges to create users',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email address already exists' });
    }

    // Generate secure random temporary password (e.g. 8-char hex string) or use custom provided
    const rawPass = password || customPassword;
    const hasCustomPassword = !!(rawPass && rawPass.trim());
    const tempPassword = hasCustomPassword 
      ? rawPass.trim() 
      : crypto.randomBytes(4).toString('hex') + 'A1!';

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // If a custom password was explicitly provided, allow direct login immediately.
    // If the password was auto-generated, require first-time OTP verification & password setup.
    const isFirstLogin = !hasCustomPassword;

    let reportsToId = req.body.reportsToId && typeof req.body.reportsToId === 'string' && req.body.reportsToId.trim()
      ? req.body.reportsToId.trim()
      : null;

    // Default reportsToId if not explicitly provided:
    // If a Team Lead creates an AGENT, bind to creator
    // If an Admin creates a TEAM_LEAD, bind to creator
    const currentUserId = req.user?.userId || req.user?.id;
    if (!reportsToId) {
      if (currentUserRole === 'TEAM_LEAD' && role === 'AGENT') {
        reportsToId = currentUserId;
      } else if (currentUserRole === 'ADMIN' && role === 'TEAM_LEAD') {
        reportsToId = currentUserId;
      }
    }

    // Strict Tier-Based Hierarchy & Multi-Tenant Validation
    await validateHierarchyAssignment({
      userId: null,
      userRole: role,
      reportsToId,
      tenantId,
    });

    // Enforce Manager Capacity Quota (hierarchical maxTeamLeads / maxAgents)
    if (reportsToId) {
      const manager = await prisma.user.findFirst({
        where: { id: reportsToId, tenantId },
        select: { id: true, name: true, email: true, role: true, maxTeamLeads: true, maxAgents: true },
      });

      if (manager) {
        if (role === 'TEAM_LEAD' && manager.role === 'ADMIN') {
          const currentCount = await prisma.user.count({
            where: { reportsToId: manager.id, role: 'TEAM_LEAD', isActive: true, tenantId },
          });
          const limit = manager.maxTeamLeads !== null && manager.maxTeamLeads !== undefined ? manager.maxTeamLeads : 1;
          if (currentCount >= limit) {
            return res.status(403).json({
              success: false,
              error: `Quota exceeded: ${manager.name || manager.email} can only manage up to ${limit} Team Lead(s) (current active: ${currentCount}). Request a quota increase from Super Admin.`,
            });
          }
        } else if (role === 'AGENT' && manager.role === 'TEAM_LEAD') {
          const currentCount = await prisma.user.count({
            where: { reportsToId: manager.id, role: 'AGENT', isActive: true, tenantId },
          });
          const limit = manager.maxAgents !== null && manager.maxAgents !== undefined ? manager.maxAgents : 1;
          if (currentCount >= limit) {
            return res.status(403).json({
              success: false,
              error: `Quota exceeded: ${manager.name || manager.email} can only manage up to ${limit} Sales Agent(s) (current active: ${currentCount}). Request a quota increase from Super Admin.`,
            });
          }
        }
      }
    }

    const initMaxTeamLeads = req.body.maxTeamLeads !== undefined ? parseInt(req.body.maxTeamLeads, 10) : 1;
    let initMaxAgents = req.body.maxAgents !== undefined ? parseInt(req.body.maxAgents, 10) : undefined;

    if (role === 'TEAM_LEAD' && reportsToId) {
      const parentAdmin = await prisma.user.findFirst({
        where: { id: reportsToId, tenantId },
        select: { maxAgents: true },
      });
      const adminAgentsLimit = parentAdmin?.maxAgents !== null && parentAdmin?.maxAgents !== undefined ? parentAdmin.maxAgents : 1;

      if (initMaxAgents !== undefined && !isNaN(initMaxAgents)) {
        if (req.user?.role === 'ADMIN' && initMaxAgents > adminAgentsLimit) {
          return res.status(403).json({
            success: false,
            error: `Forbidden: Cannot set Team Lead agent quota (${initMaxAgents}) higher than your Administrator capacity ceiling (${adminAgentsLimit}).`,
          });
        }
      } else {
        initMaxAgents = adminAgentsLimit;
      }
    } else if (role === 'ADMIN') {
      if (initMaxAgents === undefined || isNaN(initMaxAgents)) {
        initMaxAgents = 1;
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : null,
        email: cleanEmail,
        password: hashedPassword,
        role,
        reportsToId,
        tenantId,
        isActive: true,
        isFirstLogin,
        ...(role === 'ADMIN' && {
          maxTeamLeads: !isNaN(initMaxTeamLeads) ? initMaxTeamLeads : 1,
          maxAgents: !isNaN(initMaxAgents) ? initMaxAgents : 1,
        }),
        ...(role === 'TEAM_LEAD' && {
          maxAgents: !isNaN(initMaxAgents) ? initMaxAgents : 1,
        }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        bio: true,
        avatar: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        isFirstLogin: true,
        maxTeamLeads: true,
        maxAgents: true,
        createdAt: true,
      },
    });

    // Log enterprise audit event
    await logAudit({
      tenantId,
      performedById: req.user?.userId || req.user?.id,
      targetUserId: newUser.id,
      action: 'USER_CREATED',
      details: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        reportsToId: newUser.reportsToId,
      },
    });

    // Send Welcome Email containing initial temporary credentials
    try {
      await sendWelcomeEmail(cleanEmail, name, tempPassword, role);
    } catch (mailErr) {
      console.warn('[Mailer] Failed to send welcome email:', mailErr.message);
    }

    // Socket.IO broadcast user creation
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('user_created', newUser);
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', { message: 'New member added to hierarchy' });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast user_created:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: `User ${cleanEmail} provisioned successfully with role ${role}. Welcome email sent!`,
      data: {
        user: newUser,
        tempPasswordPreview: tempPassword,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error provisioning user:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to provision user' });
  }
});

// POST: Profile Security - Request OTP to verify email or password changes (Rate Limited)
router.post('/profile/request-otp', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    const { newEmail } = req.body;
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User account not found' });
    }

    // Rate limiting check (60s minimum interval)
    if (user.otpExpiresAt) {
      const timeRemaining = new Date(user.otpExpiresAt).getTime() - Date.now();
      if (timeRemaining > 9 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: 'Please wait 60 seconds before requesting another security OTP.',
        });
      }
    }

    let targetEmail = user.email;
    let pendingEmailVal = null;

    if (newEmail && newEmail.trim()) {
      const cleanNewEmail = newEmail.toLowerCase().trim();
      if (cleanNewEmail === user.email) {
        return res.status(400).json({ success: false, error: 'New email address is identical to your current email' });
      }

      // Check if new email is already taken by another account
      const taken = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
      if (taken) {
        return res.status(409).json({ success: false, error: 'This new email address is already in use' });
      }

      targetEmail = cleanNewEmail;
      pendingEmailVal = cleanNewEmail;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otpCode);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        pendingEmail: pendingEmailVal,
      },
    });

    const contextMsg = pendingEmailVal 
      ? 'Email Change Inbox Verification' 
      : 'Password Change Security Verification';

    await sendOtpEmail(targetEmail, otpCode, contextMsg);

    res.status(200).json({
      success: true,
      message: `Security OTP sent to ${targetEmail}. Please verify to complete changes.`,
      targetEmail,
    });
  } catch (error) {
    console.error('Error requesting profile OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch security OTP' });
  }
});

// PUT: Profile Security - Update Password or Email after validating OTP (Atomic $transaction)
router.put('/profile/security', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { otpCode, newPassword } = req.body;
    if (!otpCode) {
      return res.status(400).json({ success: false, error: 'OTP verification code is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, error: 'No active OTP request found. Please request an OTP first.' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0, pendingEmail: null },
      });
      return res.status(400).json({ success: false, error: 'Security OTP has expired. Please request a new code.' });
    }

    const computedHash = hashOtp(otpCode);
    if (computedHash !== user.otpHash) {
      const updatedAttempts = user.otpAttempts + 1;
      if (updatedAttempts >= 3) {
        await prisma.user.update({
          where: { id: user.id },
          data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0, pendingEmail: null },
        });
        return res.status(400).json({
          success: false,
          error: 'Maximum OTP verification attempts exceeded. OTP invalidated for security.',
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: updatedAttempts },
      });

      return res.status(400).json({
        success: false,
        error: `Invalid OTP code. Remaining attempts: ${3 - updatedAttempts}`,
      });
    }

    // Determine what credential changes are requested
    let updatedEmail = user.email;
    let updatedPassword = user.password;

    if (user.pendingEmail) {
      updatedEmail = user.pendingEmail;
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }
      updatedPassword = await bcrypt.hash(newPassword.trim(), 10);
    }

    // Execute atomic $transaction to apply changes, clear OTP & increment tokenVersion
    const updatedUser = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: user.id },
        data: {
          email: updatedEmail,
          password: updatedPassword,
          pendingEmail: null,
          otpHash: null,
          otpExpiresAt: null,
          otpAttempts: 0,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          isActive: true,
          isFirstLogin: true,
          tokenVersion: true,
        },
      });
      return result;
    });

    // Generate fresh JWT token with updated tokenVersion
    const newToken = jwt.sign(
      {
        userId: updatedUser.id,
        tenantId: updatedUser.tenantId,
        role: updatedUser.role,
        tokenVersion: updatedUser.tokenVersion,
      },
      process.env.JWT_SECRET || 'development_jwt_secret_key',
      { expiresIn: '12h' }
    );

    res.status(200).json({
      success: true,
      message: 'Account security profile updated successfully!',
      data: {
        token: newToken,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Error updating security profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update security profile' });
  }
});

// PUT: Update current authenticated user profile (name, phone, bio, avatar) with real-time broadcast
router.put('/profile', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    const { name, phone, bio, avatar } = req.body;

    // Require at least one field to update
    if (name === undefined && phone === undefined && bio === undefined && avatar === undefined) {
      return res.status(400).json({ success: false, error: 'At least one profile field is required' });
    }

    // Enforce 100KB limit on avatar base64 payload to prevent database bloat
    if (avatar && typeof avatar === 'string' && avatar.length > 100 * 1024) {
      return res.status(400).json({ success: false, error: 'Avatar image exceeds 100KB limit. Please use a smaller image.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        ...(name !== undefined && { name: name ? name.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(bio !== undefined && { bio: bio ? bio.trim() : null }),
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
      select: { id: true, name: true, phone: true, bio: true, avatar: true, email: true, role: true, tenantId: true, isActive: true, isFirstLogin: true }
    });

    // Real-time broadcast to all connected clients in the tenant
    try {
      const { io } = require('../index');
      if (io) {
        const store = tenantStorage.getStore();
        const tenantId = req.user?.tenantId || store?.tenantId;
        io.to(`tenant:${tenantId}`).emit('user_updated', updatedUser);
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast user_updated:', socketErr.message);
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update user profile' });
  }
});

// GET: Fetch all active users/agents in the current tenant (Admins & Team Leads) or all tenants (Super Admin)
router.get('/', authorize(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const currentUserId = req.user?.userId || req.user?.id;
    const currentUserRole = req.user?.role;

    const where = currentUserRole === 'SUPER_ADMIN' ? {} : { tenantId };

    // Strict Hierarchy-Branch Scoping:
    // - Admins can view all accounts (Admins, Team Leads, Sales Agents) in their organization tenant.
    // - Team Leads can ONLY see their downstream squad members and their own profile.
    if (currentUserRole === 'TEAM_LEAD') {
      // Team Leads can ONLY see their downstream squad members and their own profile
      const { getDownstreamUserIds } = require('../utils/hierarchy');
      const squadIds = await getDownstreamUserIds(currentUserId, tenantId);
      where.id = { in: squadIds };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        bio: true,
        avatar: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        isFirstLogin: true,
        maxTeamLeads: true,
        maxAgents: true,
        createdAt: true,
        reportsToId: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            maxTeamLeads: true,
            maxAgents: true,
          },
        },
        teamMembers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            maxTeamLeads: true,
            maxAgents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET: Super Admin hierarchy tree & matrix data (Super Admin only)
router.get('/hierarchy', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Super Admins only' });
    }

    const allUsers = await prisma.user.findMany({
      where: {}, // Super Admin views all platform users across all organization tenants
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        bio: true,
        avatar: true,
        isActive: true,
        isFirstLogin: true,
        reportsToId: true,
        tenantId: true,
        maxTeamLeads: true,
        maxAgents: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            maxTeamLeads: true,
            maxAgents: true,
          },
        },
        teamMembers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            maxTeamLeads: true,
            maxAgents: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const stats = {
      totalUsers: allUsers.length,
      superAdmins: allUsers.filter(u => u.role === 'SUPER_ADMIN').length,
      admins: allUsers.filter(u => u.role === 'ADMIN').length,
      teamLeads: allUsers.filter(u => u.role === 'TEAM_LEAD').length,
      agents: allUsers.filter(u => u.role === 'AGENT').length,
      assignedCount: allUsers.filter(u => u.reportsToId).length,
      unassignedCount: allUsers.filter(u => !u.reportsToId && u.role !== 'SUPER_ADMIN').length,
    };

    // Build hierarchical tree
    const userMap = new Map();
    allUsers.forEach(u => {
      userMap.set(u.id, { ...u, teamMembers: [] });
    });
    const tree = [];
    allUsers.forEach(u => {
      const node = userMap.get(u.id);
      if (u.reportsToId && userMap.has(u.reportsToId)) {
        userMap.get(u.reportsToId).teamMembers.push(node);
      } else {
        tree.push(node);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users: allUsers,
        tree,
        stats,
      }
    });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hierarchy' });
  }
});

// POST: Auto-link standard enterprise hierarchy (Super Admin only)
router.post('/hierarchy/auto-link', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Super Admins only' });
    }

    const users = await prisma.user.findMany({
      where: {} // Super Admin auto-links across all tenants
    });

    const superAdmin = users.find(u => u.role === 'SUPER_ADMIN');
    const primaryAdmin = users.find(u => u.role === 'ADMIN');
    const primaryTeamLead = users.find(u => u.role === 'TEAM_LEAD');
    const agents = users.filter(u => u.role === 'AGENT');

    const updates = [];

    // Admins report to Super Admin
    if (superAdmin) {
      users.filter(u => u.role === 'ADMIN').forEach(a => {
        updates.push(prisma.user.update({
          where: { id: a.id },
          data: { reportsToId: superAdmin.id }
        }));
      });
    }

    // Team Leads report to Admin (or Super Admin if no Admin)
    const tlTarget = primaryAdmin?.id || superAdmin?.id;
    if (tlTarget) {
      users.filter(u => u.role === 'TEAM_LEAD').forEach(tl => {
        updates.push(prisma.user.update({
          where: { id: tl.id },
          data: { reportsToId: tlTarget }
        }));
      });
    }

    // Sales Agents report to Team Lead (or Admin, or Super Admin)
    const agentTarget = primaryTeamLead?.id || primaryAdmin?.id || superAdmin?.id;
    if (agentTarget) {
      agents.forEach(ag => {
        updates.push(prisma.user.update({
          where: { id: ag.id },
          data: { reportsToId: agentTarget }
        }));
      });
    }

    // Super Admin is Root (reportsToId = null)
    if (superAdmin) {
      updates.push(prisma.user.update({
        where: { id: superAdmin.id },
        data: { reportsToId: null }
      }));
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', { message: 'Standard hierarchy auto-linked' });
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: 'Standard organizational hierarchy auto-linked successfully'
    });
  } catch (error) {
    console.error('Error auto-linking hierarchy:', error);
    res.status(500).json({ success: false, error: 'Failed to auto-link hierarchy' });
  }
});

// PUT: Bulk reassign reporting managers for multiple users (Super Admin only)
router.put('/hierarchy/bulk-reassign', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Super Admins only' });
    }

    const tenantId = req.user?.tenantId;
    const { userIds, reportsToId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required and cannot be empty' });
    }

    if (userIds.length > 100) {
      return res.status(400).json({ success: false, error: 'Cannot bulk reassign more than 100 users at once' });
    }

    // Strict Tier-Based Hierarchy & Tenant Validation on Batch
    await validateBulkHierarchyAssignment({
      userIds,
      reportsToId,
      tenantId,
    });

    // Execute atomic bulk update in a single transaction
    await prisma.$transaction(
      userIds.map(userId =>
        prisma.user.update({
          where: { id: userId },
          data: { reportsToId: reportsToId || null }
        })
      )
    );

    // Log enterprise audit event
    await logAudit({
      tenantId,
      performedById: req.user?.userId || req.user?.id,
      action: 'HIERARCHY_BULK_REASSIGNED',
      details: {
        affectedCount: userIds.length,
        userIds,
        newManagerId: reportsToId || null,
      },
    });

    // Broadcast real-time hierarchy update
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', {
          message: `Bulk reassignment: ${userIds.length} users updated`,
          userIds,
          reportsToId
        });
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `Successfully reassigned ${userIds.length} user(s) to their new reporting manager`
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error in bulk reassignment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to perform bulk reassignment' });
  }
});

// PUT: Update any user in the tenant (Admins & Team Leads & Super Admins)
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const { name, role, isActive, reportsToId, maxTeamLeads, maxAgents } = req.body;

    const currentUserRole = req.user?.role;

    const existingUser = await prisma.user.findFirst({
      where: currentUserRole === 'SUPER_ADMIN' ? { id: req.params.id } : { id: req.params.id, tenantId }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Quota Management Authorization Guard
    if (maxTeamLeads !== undefined || maxAgents !== undefined) {
      if (currentUserRole !== 'SUPER_ADMIN') {
        if (maxTeamLeads !== undefined) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Only Super Admins can assign or modify Team Lead capacity quotas (maxTeamLeads)',
          });
        }
        if (currentUserRole === 'ADMIN' && maxAgents !== undefined) {
          if (existingUser.role !== 'TEAM_LEAD') {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Administrators can only modify agent capacity quotas for Team Leads',
            });
          }
          const currentAdmin = await prisma.user.findFirst({
            where: { id: req.user?.userId || req.user?.id, tenantId: existingUser.tenantId },
            select: { maxAgents: true },
          });
          const adminCeiling = currentAdmin?.maxAgents !== null && currentAdmin?.maxAgents !== undefined ? currentAdmin.maxAgents : 1;
          const parsedRequested = parseInt(maxAgents, 10);
          if (!isNaN(parsedRequested) && parsedRequested > adminCeiling) {
            return res.status(403).json({
              success: false,
              error: `Forbidden: Cannot set Team Lead agent quota (${parsedRequested}) higher than your Administrator capacity ceiling (${adminCeiling}).`,
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You do not have permission to modify capacity quotas',
          });
        }
      }
    }

    // Strict Role Ceiling Guard:
    // - ADMIN cannot modify SUPER_ADMIN or peer ADMIN
    // - TEAM_LEAD cannot modify anyone except AGENT
    if (currentUserRole === 'ADMIN') {
      if (['SUPER_ADMIN', 'ADMIN'].includes(existingUser.role)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Administrators cannot modify peer Admins or Super Admins'
        });
      }
      if (role !== undefined && !['TEAM_LEAD', 'AGENT'].includes(role)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Administrators can only assign Team Lead or Sales Agent roles'
        });
      }
    } else if (currentUserRole === 'TEAM_LEAD') {
      if (existingUser.role !== 'AGENT') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Team Leads can only modify Sales Agents'
        });
      }
      if (role !== undefined && role !== 'AGENT') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Team Leads can only assign Sales Agent role'
        });
      }
    }

    // Strict Tier-Based Hierarchy & Tenant Validation
    if (reportsToId !== undefined) {
      await validateHierarchyAssignment({
        userId: req.params.id,
        userRole: role || existingUser.role,
        reportsToId,
        tenantId: existingUser.tenantId,
      });
    } else if (role !== undefined && existingUser.reportsToId) {
      // If role is being changed without modifying reportsToId, ensure existing manager fits new role tier
      await validateHierarchyAssignment({
        userId: req.params.id,
        userRole: role,
        reportsToId: existingUser.reportsToId,
        tenantId: existingUser.tenantId,
      });
    }

    const userSelectFields = {
      id: true,
      name: true,
      phone: true,
      bio: true,
      avatar: true,
      email: true,
      role: true,
      tenantId: true,
      isActive: true,
      isFirstLogin: true,
      maxTeamLeads: true,
      maxAgents: true,
      createdAt: true,
      reportsToId: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
      teamMembers: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
    };

    let updatedUser;
    const isDeactivating = isActive === false && existingUser.isActive === true;

    const parsedMaxTeamLeads = maxTeamLeads !== undefined ? (maxTeamLeads !== null ? parseInt(maxTeamLeads, 10) : null) : undefined;
    const parsedMaxAgents = maxAgents !== undefined ? (maxAgents !== null ? parseInt(maxAgents, 10) : null) : undefined;

    if (isDeactivating) {
      // Patch 3: Atomic Tree-Healing on User Deactivation ("Zombie Manager" Prevention)
      updatedUser = await prisma.$transaction(async (tx) => {
        // 1. Query for all users where reportsToId === targetUser.id in this tenant
        const directSubordinates = await tx.user.findMany({
          where: { reportsToId: existingUser.id, tenantId },
          select: { id: true, name: true, email: true },
        });

        if (directSubordinates.length > 0) {
          // 2. Reassign subordinates to deactivated user's manager, or requesting user
          const fallbackManagerId = existingUser.reportsToId || req.user?.id || req.user?.userId;

          await tx.user.updateMany({
            where: { reportsToId: existingUser.id, tenantId },
            data: { reportsToId: fallbackManagerId },
          });

          console.log(`[Zombie Manager Patch] Reassigned ${directSubordinates.length} subordinates of deactivated user ${existingUser.id} to fallback manager ${fallbackManagerId}`);
        }

        // 3. Mark target user as inactive & revoke session tokenVersion
        return tx.user.update({
          where: { id: req.params.id },
          data: {
            ...(name !== undefined && { name: name ? name.trim() : null }),
            ...(role !== undefined && { role }),
            isActive: false,
            tokenVersion: { increment: 1 },
            ...(reportsToId !== undefined && { reportsToId: reportsToId ? reportsToId : null }),
            ...(parsedMaxTeamLeads !== undefined && { maxTeamLeads: parsedMaxTeamLeads }),
            ...(parsedMaxAgents !== undefined && { maxAgents: parsedMaxAgents }),
          },
          select: userSelectFields,
        });
      });
    } else {
      updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name: name ? name.trim() : null }),
          ...(role !== undefined && { role }),
          ...(isActive !== undefined && { isActive }),
          ...(reportsToId !== undefined && { reportsToId: reportsToId ? reportsToId : null }),
          ...(parsedMaxTeamLeads !== undefined && { maxTeamLeads: parsedMaxTeamLeads }),
          ...(parsedMaxAgents !== undefined && { maxAgents: parsedMaxAgents }),
        },
        select: userSelectFields,
      });
    }

    // Log enterprise audit events
    const performedById = req.user?.userId || req.user?.id;
    const reportsToChanged = reportsToId !== undefined && (reportsToId || null) !== (existingUser.reportsToId || null);
    const roleChanged = role !== undefined && role !== existingUser.role;
    const deactivationHappened = isDeactivating;
    const activationHappened = isActive === true && existingUser.isActive === false;
    const quotaChanged = (parsedMaxTeamLeads !== undefined && parsedMaxTeamLeads !== existingUser.maxTeamLeads) || (parsedMaxAgents !== undefined && parsedMaxAgents !== existingUser.maxAgents);

    if (quotaChanged) {
      await logAudit({
        tenantId,
        performedById,
        targetUserId: updatedUser.id,
        action: 'USER_QUOTA_UPDATED',
        details: {
          userName: updatedUser.name || updatedUser.email,
          maxTeamLeads: updatedUser.maxTeamLeads,
          maxAgents: updatedUser.maxAgents,
        },
      });
    }

    if (reportsToChanged) {
      await logAudit({
        tenantId,
        performedById,
        targetUserId: updatedUser.id,
        action: 'HIERARCHY_REASSIGNED',
        details: {
          userName: updatedUser.name || updatedUser.email,
          role: updatedUser.role,
          previousManagerId: existingUser.reportsToId || null,
          newManagerId: updatedUser.reportsToId || null,
        },
      });
    }

    if (deactivationHappened) {
      await logAudit({
        tenantId,
        performedById,
        targetUserId: updatedUser.id,
        action: 'USER_DEACTIVATED',
        details: {
          userName: updatedUser.name || updatedUser.email,
          role: updatedUser.role,
        },
      });
    } else if (activationHappened) {
      await logAudit({
        tenantId,
        performedById,
        targetUserId: updatedUser.id,
        action: 'USER_ACTIVATED',
        details: {
          userName: updatedUser.name || updatedUser.email,
          role: updatedUser.role,
        },
      });
    }

    if (roleChanged) {
      await logAudit({
        tenantId,
        performedById,
        targetUserId: updatedUser.id,
        action: 'USER_ROLE_CHANGED',
        details: {
          userName: updatedUser.name || updatedUser.email,
          previousRole: existingUser.role,
          newRole: updatedUser.role,
        },
      });
    }

    // Broadcast user update & account blocked socket notification
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('user_updated', updatedUser);
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', { userId: updatedUser.id });

        if (deactivationHappened) {
          io.to(`user:${updatedUser.id}`).emit('account_blocked', {
            userId: updatedUser.id,
            message: 'Your account has been blocked by Super Admin.',
          });
        }
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast user_updated:', socketErr.message);
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update user' });
  }
});

// DELETE: Delete user with relational cleanup in transaction (Super Admin only)
router.delete('/:id', authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const targetUserId = req.params.id;

    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Super Admins only' });
    }

    if (req.user?.id === targetUserId) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, error: 'Cannot delete a Super Admin root user' });
    }

    // Pre-Deletion Cleanup in Prisma $transaction
    await prisma.$transaction(async (tx) => {
      // 1. Subordinates: Reassign to targetUser's manager or set to null
      await tx.user.updateMany({
        where: { reportsToId: targetUserId },
        data: { reportsToId: targetUser.reportsToId || null },
      });

      // 2. Leads: Return assigned leads to unassigned pool
      await tx.lead.updateMany({
        where: { assignedToId: targetUserId },
        data: { assignedToId: null },
      });

      // 3. Deals: Clear assigned agent
      await tx.deal.updateMany({
        where: { assignedToId: targetUserId },
        data: { assignedToId: null },
      });

      // 4. Followups: Clear assignedTo and createdBy
      await tx.followup.updateMany({
        where: { assignedToId: targetUserId },
        data: { assignedToId: null },
      });
      await tx.followup.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: null },
      });

      // 5. Activities: Clear createdBy
      await tx.activity.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: null },
      });

      // 6. Attachments: Reassign creator to the requesting Super Admin (field is non-nullable)
      await tx.attachment.updateMany({
        where: { createdById: targetUserId },
        data: { createdById: req.user.id },
      });

      // 7. Notifications: Remove any user notifications
      await tx.notification.deleteMany({
        where: { userId: targetUserId },
      });

      // 8. Delete the user
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    // Log enterprise audit event
    await logAudit({
      tenantId,
      performedById: req.user?.userId || req.user?.id,
      targetUserId,
      action: 'USER_DELETED',
      details: {
        deletedUserName: targetUser.name || targetUser.email,
        deletedUserEmail: targetUser.email,
        deletedUserRole: targetUser.role,
      },
    });

    // Broadcast real-time deletion events
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('user_deleted', { userId: targetUserId });
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', { userId: targetUserId, action: 'deleted' });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast user_deleted:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: `User ${targetUser.name || targetUser.email} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

module.exports = router;

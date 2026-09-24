const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authorize } = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/mailer');
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
router.post('/', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
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
          error: 'Invalid user role specified. Admins can create Team Leads and Sales Agents',
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
    const tempPassword = rawPass && rawPass.trim() 
      ? rawPass.trim() 
      : crypto.randomBytes(4).toString('hex') + 'A1!';

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : null,
        email: cleanEmail,
        password: hashedPassword,
        role,
        tenantId,
        isActive: true,
        isFirstLogin: true,
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
        createdAt: true,
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
    console.error('Error provisioning user:', error);
    res.status(500).json({ success: false, error: 'Failed to provision user' });
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

// GET: Fetch all active users/agents in the current tenant (Admins & Team Leads only)
router.get('/', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const currentUserId = req.user?.userId || req.user?.id;
    const currentUserRole = req.user?.role;

    const where = { tenantId };

    // Team Leads can ONLY see Sales Agents and their own profile
    if (currentUserRole === 'TEAM_LEAD') {
      where.OR = [
        { role: 'AGENT' },
        { id: currentUserId },
      ];
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
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// PUT: Update any user in the tenant (Admins & Team Leads only)
router.put('/:id', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const { name, role, isActive } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found in this tenant' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name ? name.trim() : null }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
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
        createdAt: true,
      }
    });

    // Broadcast user update
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('user_updated', updatedUser);
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast user_updated:', socketErr.message);
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

module.exports = router;

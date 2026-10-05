const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/db');
const { sendOtpEmail } = require('../services/mailer');
const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to calculate SHA-256 hash for OTP codes
function hashOtp(otpCode) {
  return crypto.createHash('sha256').update(String(otpCode).trim()).digest('hex');
}

// POST: Authenticate user and trigger OTP if first-time login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // First-Time Login: Require OTP and mandatory initial password change
    if (user.isFirstLogin) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = hashOtp(otpCode);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpHash,
          otpExpiresAt,
          otpAttempts: 0,
        },
      });

      // Send OTP via Mailer
      await sendOtpEmail(user.email, otpCode, 'First-Time Account Login Verification');

      // SECURITY: Only expose otpPreview in fully offline local dev (no cloud env, no email provider)
      const isDevOffline =
        process.env.NODE_ENV !== 'production' &&
        !process.env.RAILWAY_ENVIRONMENT &&
        !process.env.RESEND_API_KEY &&
        !process.env.EMAIL_USER;
      const otpPreview = isDevOffline ? otpCode : undefined;

      return res.status(200).json({
        success: true,
        requireOtp: true,
        isFirstLogin: true,
        email: user.email,
        message: 'First-time login detected. A 6-digit OTP code has been sent to your email.',
        data: {
          requireOtp: true,
          isFirstLogin: true,
          email: user.email,
          message: 'First-time login detected. A 6-digit OTP code has been sent to your email.',
          otpPreview,
        },
      });
    }

    // Normal Login: Issue JWT token with current tokenVersion
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
      },
      process.env.JWT_SECRET || 'development_jwt_secret_key',
      { expiresIn: '12h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || null,
          bio: user.bio || null,
          avatar: user.avatar || null,
          tenantId: user.tenantId,
          isFirstLogin: user.isFirstLogin,
        },
      },
    });
  } catch (error) {
    console.error('[Auth Route] Login error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// POST: Google OAuth Token Verification & Enterprise SaaS Session Issuance
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Google credential token is required',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // 1. Verify Google's cryptographic ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId || undefined,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token payload',
      });
    }

    const email = payload.email.toLowerCase().trim();

    // 2. Look up user in database (Enforces B2B closed SaaS security & tenant isolation)
    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!dbUser) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. No active enterprise account found for this Google email. Contact your organization administrator to invite you.',
      });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account is deactivated. Please contact your administrator.',
      });
    }

    // 3. Issue standard tenant-bound SaaS JWT
    const token = jwt.sign(
      {
        userId: dbUser.id,
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        tokenVersion: dbUser.tokenVersion || 0,
      },
      process.env.JWT_SECRET || 'development_jwt_secret_key',
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: dbUser.id,
      name: dbUser.name || payload.name || 'User',
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone || null,
      bio: dbUser.bio || null,
      avatar: dbUser.avatar || payload.picture || null,
      tenantId: dbUser.tenantId,
      isFirstLogin: dbUser.isFirstLogin,
    };

    return res.status(200).json({
      success: true,
      token,
      data: {
        token,
        user: userProfile,
      },
      user: userProfile,
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Google authentication failed or token is invalid: ' + error.message,
    });
  }
});

// POST: Verify OTP and complete login / initial password reset (Atomic $transaction)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User account not found or inactive' });
    }

    // Validate OTP existence and expiration
    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ success: false, error: 'No active OTP verification code found. Please request a new code.' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return res.status(400).json({ success: false, error: 'OTP code has expired. Please request a new code.' });
    }

    // Compare SHA-256 hashes
    const computedHash = hashOtp(otpCode);
    if (computedHash !== user.otpHash) {
      const updatedAttempts = user.otpAttempts + 1;
      if (updatedAttempts >= 3) {
        // Brute-force limit reached: invalidate OTP immediately
        await prisma.user.update({
          where: { id: user.id },
          data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
        });
        return res.status(400).json({
          success: false,
          error: 'Maximum invalid attempts exceeded (3/3). OTP has been invalidated for security. Please request a new code.',
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

    // OTP Verified! If first-time login, enforce mandatory new password setup
    let hashedPassword = user.password;
    if (user.isFirstLogin) {
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, error: 'Please set a secure new password (at least 6 characters)' });
      }
      hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    }

    // Atomic Prisma $transaction for state update & tokenVersion increment
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
          otpHash: null,
          otpExpiresAt: null,
          otpAttempts: 0,
          tokenVersion: { increment: 1 },
        },
      });
      return updated;
    });

    // Sign fresh JWT token
    const token = jwt.sign(
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
      message: 'OTP verified successfully!',
      data: {
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone || null,
          bio: updatedUser.bio || null,
          avatar: updatedUser.avatar || null,
          tenantId: updatedUser.tenantId,
          isFirstLogin: false,
        },
      },
    });
  } catch (error) {
    console.error('[Auth Route] OTP verification error:', error);
    res.status(500).json({ success: false, error: 'OTP verification failed' });
  }
});

// POST: Resend OTP code with rate-limiting safeguard
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // Rate-limiting safeguard: Check if an OTP was issued less than 60 seconds ago
    if (user.otpExpiresAt) {
      const timeRemaining = new Date(user.otpExpiresAt).getTime() - Date.now();
      // 10 minutes total validity -> 9 minutes remaining means created < 60s ago
      if (timeRemaining > 9 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: 'Please wait 60 seconds before requesting another OTP code.',
        });
      }
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
      },
    });

    await sendOtpEmail(cleanEmail, otpCode, 'Resent Security Verification Code');

    // SECURITY: Only expose otpPreview in fully offline local dev (no cloud env, no email provider)
    const isDevOffline =
      process.env.NODE_ENV !== 'production' &&
      !process.env.RAILWAY_ENVIRONMENT &&
      !process.env.RESEND_API_KEY &&
      !process.env.EMAIL_USER;
    const otpPreview = isDevOffline ? otpCode : undefined;

    res.status(200).json({
      success: true,
      message: 'A fresh OTP verification code has been dispatched to your email.',
      data: {
        message: 'A fresh OTP verification code has been dispatched to your email.',
        otpPreview,
      },
    });
  } catch (error) {
    console.error('[Auth Route] Resend OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend OTP' });
  }
});

// POST: Self-service Forgot Password - Dispatch OTP reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Anti-enumeration: Return 200 OK even if user doesn't exist or is inactive
    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email address, a password reset code has been sent.',
      });
    }

    // Rate-limiting safeguard: Allow maximum 1 request per 60 seconds
    if (user.otpExpiresAt) {
      const timeRemaining = new Date(user.otpExpiresAt).getTime() - Date.now();
      if (timeRemaining > 9 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          error: 'Please wait 60 seconds before requesting another reset code.',
        });
      }
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otpCode);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
      },
    });

    // Dispatch email with subject "Your password reset code"
    await sendOtpEmail(user.email, otpCode, 'Your password reset code');

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email address, a password reset code has been sent.',
    });
  } catch (error) {
    console.error('[Auth Route] Forgot password error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to process password reset' });
  }
});

// POST: Self-service Reset Password - Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, OTP code, and new password are required',
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Verify OTP exists and is not expired
    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
      });
    }

    // Check brute-force attempts
    if (user.otpAttempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return res.status(400).json({
        success: false,
        error: 'Maximum invalid attempts exceeded. Please request a new code.',
      });
    }

    // Hash the provided OTP and compare against stored otpHash
    const computedHash = hashOtp(otp);
    if (computedHash !== user.otpHash) {
      const updatedAttempts = (user.otpAttempts || 0) + 1;
      if (updatedAttempts >= 3) {
        await prisma.user.update({
          where: { id: user.id },
          data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
        });
        return res.status(400).json({
          success: false,
          error: 'Maximum invalid attempts exceeded. Please request a new code.',
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: updatedAttempts },
      });

      return res.status(400).json({
        success: false,
        error: `Invalid or expired OTP. Remaining attempts: ${3 - updatedAttempts}`,
      });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update user password and clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        isFirstLogin: false,
        tokenVersion: { increment: 1 },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been securely updated. You can now log in.',
    });
  } catch (error) {
    console.error('[Auth Route] Reset password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// POST: Self-service Registration for new organization/account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Sanitize email typos (e.g. w3schools.@com -> w3schools@com)
    let cleanEmail = email.toLowerCase().trim().replace(/\.+@/, '@');

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid work email address (e.g. name@company.com)',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email address already exists. Please sign in.' });
    }

    const tenantName = companyName?.trim() || (name ? `${name.trim()}'s Organization` : 'MyCRM Tenant');

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        wabaId: `WABA_${Date.now()}`,
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : null,
        email: cleanEmail,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true,
        isFirstLogin: false,
        maxTeamLeads: 1,
        maxAgents: 1,
      },
    });

    const token = jwt.sign(
      {
        userId: newUser.id,
        tenantId: newUser.tenantId,
        role: newUser.role,
        tokenVersion: newUser.tokenVersion || 0,
      },
      process.env.JWT_SECRET || 'development_jwt_secret_key',
      { expiresIn: '12h' }
    );

    // Broadcast real-time Socket.IO notification for new Admin registration
    try {
      const { io } = require('../index');
      if (io) {
        io.emit('user_created', newUser);
        io.emit('hierarchy_updated', { message: 'New organization Admin account registered' });
      }
    } catch (socketErr) {
      console.warn('[Socket] Failed to broadcast register user_created:', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account and organization created successfully! Signing you in...',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          tenantId: newUser.tenantId,
        },
      },
    });
  } catch (error) {
    console.error('[Auth Route] Registration error:', error);
    res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
});

// POST: Seed initial tenant and admin user for testing
router.post('/seed', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    let tenant = await prisma.tenant.findUnique({
      where: { wabaId: 'WABA_ID_TEST' },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          wabaId: 'WABA_ID_TEST',
        },
      });
    }

    // Super Admin - top of the hierarchy
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdminUser = await prisma.user.upsert({
      where: { email: 'superadmin123@crm.com' },
      update: {
        password: superAdminPassword,
        tenantId: tenant.id,
        role: 'SUPER_ADMIN',
        isActive: true,
        isFirstLogin: false,
      },
      create: {
        email: 'superadmin123@crm.com',
        name: 'Super Admin',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        isActive: true,
        isFirstLogin: false,
      },
    });

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@crm.com' },
      update: {
        password: hashedPassword,
        tenantId: tenant.id,
        role: 'ADMIN',
        isActive: true,
        isFirstLogin: false,
      },
      create: {
        email: 'admin@crm.com',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true,
        isFirstLogin: false,
      },
    });

    const teamLeadPassword = await bcrypt.hash('teamlead123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);

    const teamLeadUser = await prisma.user.upsert({
      where: { email: 'teamlead@crm.com' },
      update: {
        password: teamLeadPassword,
        tenantId: tenant.id,
        role: 'TEAM_LEAD',
        isActive: true,
        isFirstLogin: false,
      },
      create: {
        email: 'teamlead@crm.com',
        password: teamLeadPassword,
        role: 'TEAM_LEAD',
        tenantId: tenant.id,
        isActive: true,
        isFirstLogin: false,
      },
    });

    const agentUser = await prisma.user.upsert({
      where: { email: 'agent@crm.com' },
      update: {
        password: agentPassword,
        tenantId: tenant.id,
        role: 'AGENT',
        isActive: true,
        isFirstLogin: false,
      },
      create: {
        email: 'agent@crm.com',
        password: agentPassword,
        role: 'AGENT',
        tenantId: tenant.id,
        isActive: true,
        isFirstLogin: false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin, Admin, Team Lead, and Sales Agent seeded successfully',
      data: {
        tenant,
        users: [
          { email: superAdminUser.email, role: superAdminUser.role },
          { email: adminUser.email, role: adminUser.role },
          { email: teamLeadUser.email, role: teamLeadUser.role },
          { email: agentUser.email, role: agentUser.role },
        ],
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, error: 'Seeding failed' });
  }
});

module.exports = router;

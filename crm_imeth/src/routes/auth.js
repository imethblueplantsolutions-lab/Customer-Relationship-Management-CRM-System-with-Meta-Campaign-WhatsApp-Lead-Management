const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendOtpEmail } = require('../services/mailer');
const router = express.Router();

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

      return res.status(200).json({
        success: true,
        requireOtp: true,
        isFirstLogin: true,
        email: user.email,
        message: 'First-time login detected. A 6-digit OTP code has been sent to your email.',
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

    res.status(200).json({
      success: true,
      message: 'A fresh OTP verification code has been dispatched to your email.',
    });
  } catch (error) {
    console.error('[Auth Route] Resend OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to resend OTP' });
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
      message: 'Admin, Team Lead, and Sales Agent seeded successfully',
      data: {
        tenant,
        users: [
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

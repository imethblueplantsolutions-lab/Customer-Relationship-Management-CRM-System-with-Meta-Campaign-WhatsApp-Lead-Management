const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const router = express.Router();

// POST: Authenticate user and issue JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET || 'development_jwt_secret_key',
      { expiresIn: '12h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

// POST: Seed initial tenant and admin user for testing
router.post('/seed', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Upsert or create tenant and admin user
    let tenant = await prisma.tenant.findUnique({
      where: { wabaId: 'WABA_ID_TEST' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          wabaId: 'WABA_ID_TEST'
        }
      });
    }

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@crm.com' },
      update: {
        password: hashedPassword,
        tenantId: tenant.id,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        email: 'admin@crm.com',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admin user and tenant seeded successfully',
      data: {
        tenant,
        user: { email: adminUser.email, role: adminUser.role, tenantId: adminUser.tenantId }
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, error: 'Seeding failed' });
  }
});

module.exports = router;

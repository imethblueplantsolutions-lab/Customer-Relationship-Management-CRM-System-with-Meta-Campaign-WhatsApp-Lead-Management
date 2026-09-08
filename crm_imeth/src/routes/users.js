const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authorize } = require('../middleware/auth');

// GET: Fetch current authenticated user profile
router.get('/me', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true }
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

// PUT: Update current authenticated user profile (name) with real-time broadcast
router.put('/profile', async (req, res) => {
  try {
    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true }
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

    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: 'asc' }
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
      select: { id: true, name: true, email: true, role: true, tenantId: true, isActive: true }
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

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Enforce JWT authentication on all notification routes
router.use(authenticate);

// GET /: Fetch all notifications for req.user.userId, ordered by createdAt descending
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID not found in token' });
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Normalize to ensure both message and body are populated
    const normalized = notifications.map((n) => ({
      ...n,
      message: n.message || n.body,
      body: n.body || n.message,
    }));

    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// GET /unread-count: Return count of unread notifications for badge
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID not found in token' });
    }

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
});

// PUT /read-all: Mark all notifications for the user as isRead: true
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID not found in token' });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

// PUT /:id/read: Mark a specific notification as isRead: true
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID not found in token' });
    }

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('[Notifications] Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET: Fetch current user's notifications (unread first, up to 30)
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 30
    });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// GET: Return unread notification count (for badge)
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const count = await prisma.notification.count({
      where: { userId, isRead: false }
    });
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
});

// PUT: Mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// PUT: Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
});

module.exports = router;

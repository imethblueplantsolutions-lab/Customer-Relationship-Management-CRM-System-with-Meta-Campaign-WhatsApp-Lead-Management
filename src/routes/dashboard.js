const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

router.get('/stats', async (req, res) => {
  try {
    const [
      totalLeads,
      newLeads,
      convertedLeads,
      leadsByStatus,
      recentLeads,
      pendingFollowups
    ] = await Promise.all([
      prisma.lead.count({ where: { isDeleted: false } }),
      prisma.lead.count({ where: { isDeleted: false, status: 'NEW' } }),
      prisma.lead.count({ where: { isDeleted: false, status: 'CONVERTED' } }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { isDeleted: false }
      }),
      prisma.lead.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { lastActivityAt: 'desc' },
        include: { attribution: true }
      }),
      prisma.followup.count({
        where: { completedAt: null, dueAt: { lte: new Date() } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        convertedLeads,
        pendingFollowups,
        leadsByStatus: leadsByStatus.map(s => ({ status: s.status, count: s._count.status })),
        recentLeads
      }
    });
  } catch (error) {
    console.error('[Dashboard API] Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET: Fetch dashboard analytics and lead statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalLeads, leadsByStatus, pendingFollowups, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { isDeleted: false } }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { isDeleted: false }
      }),
      prisma.followup.count({
        where: { completedAt: null }
      }),
      prisma.lead.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { lastActivityAt: 'desc' },
        include: { attribution: true }
      })
    ]);

    const statusBreakdown = leadsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      CONVERTED: 0,
      LOST: 0
    });

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        statusBreakdown,
        pendingFollowups,
        recentLeads
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

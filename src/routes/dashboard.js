const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { tenantStorage } = require('../middleware/tenant');

// GET: Fetch dashboard analytics and lead statistics
router.get('/stats', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;
    const cacheKey = `tenant:${tenantId}:dashboard:stats`;

    // Check Redis cache first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, data: cachedData, cached: true });
    }

    const [totalLeads, leadsByStatus, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { tenantId }
      }),
      prisma.lead.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const formattedStatusCounts = leadsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      CONVERTED: 0,
      LOST: 0
    });

    const result = {
      totalLeads,
      statusBreakdown: formattedStatusCounts,
      pendingFollowups: 0,
      recentLeads
    };

    // Cache the result for 5 minutes (300 seconds)
    await CacheService.set(cacheKey, result, 300);

    res.status(200).json({ success: true, data: result, cached: false });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

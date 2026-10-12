const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { tenantStorage } = require('../middleware/tenant');
const { getHierarchyScopedUserIds, getLeadScopeCondition } = require('../utils/hierarchy');

// GET: Fetch dashboard analytics and lead statistics (Role-aware & Hierarchy-scoped)
router.get('/stats', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const role = req.user?.role || 'AGENT';
    const currentUserId = req.user?.userId || req.user?.id;

    // ── Date range filtering via query params ──
    const { from, to } = req.query;
    let dateRangeSuffix = '';
    const dateFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        dateFilter.gte = fromDate;
        dateRangeSuffix += `:from:${from}`;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        dateFilter.lte = toDate;
        dateRangeSuffix += `:to:${to}`;
      }
    }

    let cacheKey;
    if (role === 'AGENT' && currentUserId) {
      cacheKey = `tenant:${tenantId}:dashboard:stats:agent:${currentUserId}${dateRangeSuffix}`;
    } else if (role === 'TEAM_LEAD' && currentUserId) {
      cacheKey = `tenant:${tenantId}:dashboard:stats:teamlead:${currentUserId}${dateRangeSuffix}`;
    } else if (role === 'ADMIN' && currentUserId) {
      cacheKey = `tenant:${tenantId}:dashboard:stats:admin:${currentUserId}${dateRangeSuffix}`;
    } else {
      cacheKey = `tenant:${tenantId}:dashboard:stats:superadmin${dateRangeSuffix}`;
    }

    // Check Redis cache first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, data: cachedData, cached: true });
    }

    const leadScope = await getLeadScopeCondition(req.user);
    const leadWhere = { tenantId, ...leadScope };

    // Apply date range filter on lead createdAt
    if (Object.keys(dateFilter).length > 0) {
      leadWhere.createdAt = dateFilter;
    }

    const scopedUserIds = await getHierarchyScopedUserIds(req.user);
    const followupWhere = {
      completed: false,
      lead: { tenantId }
    };
    if (scopedUserIds) {
      followupWhere.assignedToId = { in: scopedUserIds };
    }

    const [totalLeads, leadsByStatus, recentLeads, pendingFollowups] = await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { status: true },
        where: leadWhere
      }),
      prisma.lead.findMany({
        where: leadWhere,
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } }
        }
      }),
      prisma.followup.count({ where: followupWhere })
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
      pendingFollowups,
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


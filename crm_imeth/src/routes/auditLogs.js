const express = require('express');
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authorize, authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/audit-logs
 * Protected by SUPER_ADMIN & ADMIN RBAC.
 * Fetches chronological audit logs strictly isolated to the requesting tenant.
 */
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'ADMIN']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context required' });
    }

    const { limit = '50', page = '1', action, targetUserId } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {
      tenantId,
      ...(action ? { action } : {}),
      ...(targetUserId ? { targetUserId } : {}),
    };

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        take: parsedLimit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
      },
    });
  } catch (error) {
    console.error('[AuditLogs API Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit logs',
    });
  }
});

module.exports = router;

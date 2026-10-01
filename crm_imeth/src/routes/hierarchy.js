const express = require('express');
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBulkHierarchyAssignment, validateHierarchyAssignment } = require('../utils/hierarchyValidation');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

/**
 * PUT /api/hierarchy/bulk-reassign
 * Bulk reassign reporting managers for multiple users (Super Admin only).
 */
router.put('/bulk-reassign', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const performedById = req.user?.userId || req.user?.id;
    const { userIds, reportsToId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required and cannot be empty' });
    }

    if (userIds.length > 100) {
      return res.status(400).json({ success: false, error: 'Cannot bulk reassign more than 100 users at once' });
    }

    // Strict Tier-Based Hierarchy & Tenant Validation on Batch
    await validateBulkHierarchyAssignment({
      userIds,
      reportsToId,
      tenantId,
    });

    // Capture previous state for audit trail
    const previousUsers = await prisma.user.findMany({
      where: { id: { in: userIds }, tenantId },
      select: { id: true, name: true, email: true, role: true, reportsToId: true },
    });

    // Execute atomic bulk update in a single transaction
    await prisma.$transaction(
      userIds.map((userId) =>
        prisma.user.update({
          where: { id: userId },
          data: { reportsToId: reportsToId || null },
        })
      )
    );

    // Write audit log entry
    await logAudit({
      tenantId,
      performedById,
      action: 'HIERARCHY_BULK_REASSIGNED',
      details: {
        affectedCount: userIds.length,
        userIds,
        newManagerId: reportsToId || null,
        previousAssignments: previousUsers.map((u) => ({
          userId: u.id,
          name: u.name,
          email: u.email,
          previousReportsToId: u.reportsToId,
        })),
      },
    });

    // Broadcast real-time hierarchy update
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('hierarchy_updated', {
          message: `Bulk reassignment: ${userIds.length} users updated`,
          userIds,
          reportsToId,
        });
      }
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `Successfully reassigned ${userIds.length} user(s) to their new reporting manager`,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('[Bulk Reassign Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to perform bulk reassignment' });
  }
});

module.exports = router;

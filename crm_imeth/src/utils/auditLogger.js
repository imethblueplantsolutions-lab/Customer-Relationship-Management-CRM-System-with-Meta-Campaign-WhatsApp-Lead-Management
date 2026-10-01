const prisma = require('../config/db');

/**
 * Logs an enterprise audit event for tenant governance, hierarchy updates, and user management.
 *
 * @param {Object} params
 * @param {string} params.tenantId - The tenant ID for strict multi-tenant isolation
 * @param {string} params.performedById - User ID of the actor initiating the change
 * @param {string} [params.targetUserId] - User ID of the affected user (optional)
 * @param {string} params.action - Action string (e.g., USER_CREATED, USER_DEACTIVATED, HIERARCHY_REASSIGNED, etc.)
 * @param {Object} [params.details] - JSON payload storing previous/new state details
 * @returns {Promise<Object|null>} Created audit log entry or null if error occurred
 */
async function logAudit({ tenantId, performedById, targetUserId = null, action, details = null }) {
  if (!tenantId || !performedById || !action) {
    console.warn('[AuditLogger] Missing required parameters:', { tenantId, performedById, action });
    return null;
  }

  try {
    const entry = await prisma.auditLog.create({
      data: {
        tenantId,
        performedById,
        targetUserId: targetUserId || null,
        action,
        details: details ? details : {},
      },
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    // Broadcast audit log event in real-time over Socket.IO to the tenant room
    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('audit_logged', entry);
      }
    } catch (_) {}

    return entry;
  } catch (err) {
    console.error('[AuditLogger] Failed to write audit log:', err.message);
    return null;
  }
}

module.exports = {
  logAudit,
};

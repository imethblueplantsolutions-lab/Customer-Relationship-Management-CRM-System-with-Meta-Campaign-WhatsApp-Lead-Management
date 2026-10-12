const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getLeadScopeCondition } = require('../utils/hierarchy');

// Enforce mandatory JWT authentication across all attachment endpoints
router.use(authenticate);

/**
 * Verifies tenant boundaries and role-based hierarchy permissions for an attachment.
 * Prevents Insecure Direct Object References (IDOR).
 *
 * @param {string} attachmentId
 * @param {object} user - Authenticated user from JWT middleware
 * @returns {Promise<object>}
 */
async function authorizeAttachmentAccess(attachmentId, user) {
  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId },
    include: {
      lead: {
        select: { id: true, tenantId: true, assignedToId: true, name: true, phoneNumber: true },
      },
      followup: {
        include: {
          lead: {
            select: { id: true, tenantId: true, assignedToId: true, name: true, phoneNumber: true },
          },
        },
      },
      createdBy: {
        select: { id: true, tenantId: true },
      },
    },
  });

  if (!attachment) {
    const error = new Error('Attachment record not found');
    error.statusCode = 404;
    throw error;
  }

  const parentLead = attachment.lead || attachment.followup?.lead;
  const attachmentTenantId = parentLead ? parentLead.tenantId : attachment.createdBy?.tenantId;

  // 1. Tenant boundary validation (Anti-IDOR)
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  if (!isSuperAdmin && attachmentTenantId !== user.tenantId) {
    const error = new Error('Attachment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Hierarchy & Role Scoping
  if (!isSuperAdmin && parentLead) {
    const scopeCondition = await getLeadScopeCondition(user);
    const authorized = await prisma.lead.findFirst({
      where: {
        id: parentLead.id,
        tenantId: user.tenantId,
        ...scopeCondition,
      },
      select: { id: true },
    });

    if (!authorized) {
      const error = new Error('Forbidden: You do not have permission to access attachments for this lead');
      error.statusCode = 403;
      throw error;
    }
  }

  return attachment;
}

/**
 * GET /api/attachments/:id
 * Primary delivery route: Serves the fileData buffer directly from PostgreSQL bytea storage.
 */
router.get('/:id', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);

    if (!attachment.fileData) {
      return res.status(404).json({ success: false, error: 'Attachment binary content not found in database' });
    }

    const mimeType = attachment.mimeType || attachment.fileType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', attachment.fileSize || attachment.fileData.length);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.fileName)}"`);

    return res.send(attachment.fileData);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to serve attachment',
    });
  }
});

/**
 * GET /api/attachments/:id/download
 * Explicit download endpoint: Forces download disposition attachment header.
 */
router.get('/:id/download', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);

    if (!attachment.fileData) {
      return res.status(404).json({ success: false, error: 'Attachment binary content not found in database' });
    }

    const mimeType = attachment.mimeType || attachment.fileType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', attachment.fileSize || attachment.fileData.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);

    return res.send(attachment.fileData);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to download attachment',
    });
  }
});

/**
 * GET /api/attachments/:id/info
 * Returns attachment metadata without loading binary payload into JSON response.
 */
router.get('/:id/info', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    const { fileData, ...metadata } = attachment;

    return res.status(200).json({ success: true, data: metadata });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to fetch attachment metadata',
    });
  }
});

module.exports = router;

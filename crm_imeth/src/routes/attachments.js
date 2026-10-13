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

/**
 * DELETE /api/attachments/:id
 * General attachment removal (Creator, Admin, or Super Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    const isOwner = attachment.createdById === req.user.id || attachment.createdById === req.user.userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to delete this attachment' });
    }

    await prisma.attachment.delete({
      where: { id: attachment.id },
    });

    return res.status(200).json({ success: true, message: 'Attachment successfully deleted' });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to delete attachment',
    });
  }
});

/**
 * DELETE /api/attachments/:id/takedown
 * DMCA Safe Harbor Expeditious Removal & Repeat Infringer Policy Enforcement.
 * Requires: ADMIN or SUPER_ADMIN role.
 * Actions:
 * 1. Permanently expunges infringing content from database.
 * 2. Increments creator's DMCA strike count.
 * 3. Enforces repeat infringer policy: bans/deactivates user upon reaching 3 strikes.
 * 4. Logs immutable audit trail with DMCA notice details.
 */
router.delete('/:id/takedown', async (req, res) => {
  try {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can execute DMCA takedown actions' });
    }

    const { noticeId, claimantName, reason, applyStrike = true } = req.body || {};
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    const uploaderId = attachment.createdById;
    const tenantId = req.user.tenantId;

    // 1. Permanently remove the infringing attachment
    await prisma.attachment.delete({
      where: { id: attachment.id },
    });

    let uploaderStatus = 'active';
    let newStrikeCount = 0;

    // 2. Repeat Infringer Policy: Track strikes and terminate repeat offenders
    if (uploaderId && applyStrike) {
      const uploader = await prisma.user.findUnique({
        where: { id: uploaderId },
        select: { id: true, email: true, name: true, dmcaStrikes: true, isActive: true },
      });

      if (uploader) {
        newStrikeCount = (uploader.dmcaStrikes || 0) + 1;
        const shouldBan = newStrikeCount >= 3;

        await prisma.user.update({
          where: { id: uploaderId },
          data: {
            dmcaStrikes: newStrikeCount,
            ...(shouldBan && { isActive: false }),
          },
        });

        uploaderStatus = shouldBan ? 'terminated_repeat_infringer' : 'warning_issued';

        if (shouldBan) {
          console.warn(`[DMCA Repeat Infringer Policy] User ${uploader.email} reached ${newStrikeCount} strikes and has been permanently terminated.`);
        }
      }
    }

    // 3. Log enterprise audit event
    const { logAudit } = require('../utils/auditLogger');
    await logAudit({
      tenantId,
      performedById: req.user?.userId || req.user?.id,
      targetUserId: uploaderId,
      action: 'DMCA_TAKEDOWN_EXECUTED',
      details: {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        noticeId: noticeId || 'DIRECT_DMCA_REQUEST',
        claimantName: claimantName || 'Undisclosed Rightsholder',
        reason: reason || 'Copyright Infringement Notice (17 U.S.C. 512(c))',
        strikes: newStrikeCount,
        uploaderStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'DMCA Takedown executed successfully. Infringing material has been removed from service.',
      details: {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        uploaderId,
        newStrikeCount,
        uploaderStatus,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to process DMCA takedown',
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getLeadScopeCondition } = require('../utils/hierarchy');

router.use(authenticate);

/**
 * Helper to resolve the physical file path for an attachment.
 */
function resolveAttachmentPath(fileUrl) {
  if (!fileUrl) return null;
  const fileName = path.basename(fileUrl);
  return path.join(__dirname, '../../uploads', fileName);
}

/**
 * Helper to verify tenant and hierarchical permissions for an attachment.
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
  if (attachmentTenantId !== user.tenantId) {
    const error = new Error('Attachment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Hierarchy & Role Scoping
  if (parentLead) {
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

// GET /:id/download: Securely download an attachment file with IDOR prevention
router.get('/:id/download', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    const filePath = resolveAttachmentPath(attachment.fileUrl);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Physical file not found on disk' });
    }

    return res.download(filePath, attachment.fileName);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, error: error.message || 'Failed to download attachment' });
  }
});

// GET /:id/view: Stream attachment inline (for browser rendering images, audio, video)
router.get('/:id/view', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    const filePath = resolveAttachmentPath(attachment.fileUrl);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Physical file not found on disk' });
    }

    res.setHeader('Content-Type', attachment.fileType || 'application/octet-stream');
    return res.sendFile(filePath);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, error: error.message || 'Failed to view attachment' });
  }
});

// GET /:id: Fetch attachment metadata
router.get('/:id', async (req, res) => {
  try {
    const attachment = await authorizeAttachmentAccess(req.params.id, req.user);
    return res.status(200).json({ success: true, data: attachment });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, error: error.message || 'Failed to fetch attachment' });
  }
});

module.exports = router;

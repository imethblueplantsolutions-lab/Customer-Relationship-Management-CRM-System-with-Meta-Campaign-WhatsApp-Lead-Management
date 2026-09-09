const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Ensure root /uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Disk Storage with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max file size limit
});

// POST: Upload a file attachment and link to Lead or Followup
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file was provided in the upload' });
    }

    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User session required' });
    }

    const { leadId, followupId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.file.mimetype || 'application/octet-stream',
        fileSize: req.file.size,
        createdById: currentUserId,
        ...(leadId && leadId.trim() && { leadId: leadId.trim() }),
        ...(followupId && followupId.trim() && { followupId: followupId.trim() }),
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        createdById: true,
        leadId: true,
        followupId: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'File attachment uploaded successfully',
      data: attachment,
    });
  } catch (error) {
    console.error('[Attachments Route] Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to save file attachment' });
  }
});

// GET: Fetch attachments for a specific lead
router.get('/lead/:leadId', authenticate, async (req, res) => {
  try {
    const { leadId } = req.params;
    const attachments = await prisma.attachment.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        createdById: true,
        leadId: true,
        followupId: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(200).json({ success: true, data: attachments });
  } catch (error) {
    console.error('Error fetching lead attachments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead attachments' });
  }
});

// GET: Fetch attachments for a specific followup
router.get('/followup/:followupId', authenticate, async (req, res) => {
  try {
    const { followupId } = req.params;
    const attachments = await prisma.attachment.findMany({
      where: { followupId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        createdById: true,
        leadId: true,
        followupId: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(200).json({ success: true, data: attachments });
  } catch (error) {
    console.error('Error fetching followup attachments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch followup attachments' });
  }
});

module.exports = router;

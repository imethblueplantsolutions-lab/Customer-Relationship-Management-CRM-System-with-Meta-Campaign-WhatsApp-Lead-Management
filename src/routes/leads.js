const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// List leads with filtering, search, and pagination
router.get('/', async (req, res) => {
  try {
    const { status, category, search, ownerId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      isDeleted: false,
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          attribution: true,
          _count: { select: { messages: true, followups: true } }
        },
        orderBy: { lastActivityAt: 'desc' },
        skip,
        take
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('[Leads API] List error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve leads' });
  }
});

// Get single lead details with full thread and followups
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        attribution: true,
        messages: { orderBy: { timestamp: 'asc' } },
        followups: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });

    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('[Leads API] Detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve lead' });
  }
});

// Manually create a lead
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, name, status, category, tags, notes, ownerId, sourceChannel } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({ success: false, message: 'Phone number and Name are required' });
    }

    const existing = await prisma.lead.findUnique({ where: { phoneNumber } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this phone number already exists',
        existingLeadId: existing.id
      });
    }

    const lead = await prisma.lead.create({
      data: {
        phoneNumber,
        name,
        status: status || 'NEW',
        category: category || null,
        tags: tags || [],
        notes: notes || null,
        ownerId: ownerId || null,
        sourceChannel: sourceChannel || 'Manual Entry'
      }
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('[Leads API] Create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
});

// Update a lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, category, tags, notes, ownerId } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes }),
        ...(ownerId !== undefined && { ownerId }),
        lastActivityAt: new Date()
      }
    });

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('[Leads API] Update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead' });
  }
});

// Soft-delete a lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('[Leads API] Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead' });
  }
});

// Add a follow-up activity
router.post('/:id/followups', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, dueAt, outcome, note, createdById } = req.body;

    // Fallback or find system user if none provided
    let userId = createdById;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser ? defaultUser.id : null;
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'A valid createdById user is required' });
    }

    const followup = await prisma.followup.create({
      data: {
        leadId: id,
        type: type || 'CALL',
        dueAt: dueAt ? new Date(dueAt) : null,
        outcome: outcome || null,
        note: note || null,
        createdById: userId
      }
    });

    await prisma.lead.update({
      where: { id },
      data: { lastActivityAt: new Date() }
    });

    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    console.error('[Leads API] Followup error:', error);
    res.status(500).json({ success: false, message: 'Failed to add follow-up' });
  }
});

module.exports = router;

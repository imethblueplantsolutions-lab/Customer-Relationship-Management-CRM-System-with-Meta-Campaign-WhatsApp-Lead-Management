const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { tenantStorage } = require('../middleware/tenant');

// Role authorization middleware helper
const authorize = (roles = []) => (req, res, next) => {
  if (!req.user || (roles.length && !roles.includes(req.user.role))) {
    return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
  }
  next();
};

// GET: Fetch all leads for current tenant with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    const where = { tenantId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, email: true, role: true } },
          attribution: true,
          _count: { select: { followups: true, messages: true } }
        },
        skip,
        take
      }),
      prisma.lead.count({ where })
    ]);

    res.status(200).json({
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
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// POST: Manually add a new customer lead (Restricted to Admin & Team Lead)
router.post('/', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { phoneNumber, name, category, tags } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Ensure Tenant exists
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: `Tenant ${tenantId}` }
    });

    const newLead = await prisma.lead.create({
      data: {
        phoneNumber,
        name: name || phoneNumber,
        category: category || 'Manual Entry',
        tags: tags || [],
        status: 'NEW',
        tenantId
      }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'This phone number already exists in your organization' });
    }
    console.error('Add lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to add customer lead' });
  }
});

// GET: Fetch single lead by ID with full attribution, messages, and follow-ups
router.get('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
        attribution: true,
        messages: { orderBy: { createdAt: 'asc' } },
        followups: { orderBy: { dueAt: 'asc' } }
      }
    });

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

// POST: Send outbound WhatsApp message via Meta Cloud API using DB Tokens
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, error: 'Message body cannot be empty' });
    }

    const lead = await prisma.lead.findFirst({ 
      where: { id, tenantId },
      include: { tenant: true }
    });
    
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    let messageId = `outbound_${Date.now()}`;

    // If Meta Cloud API credentials are configured, send to Meta
    if (lead.tenant.metaAccessToken && lead.tenant.metaPhoneNumberId) {
      const metaResponse = await fetch(`https://graph.facebook.com/v20.0/${lead.tenant.metaPhoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lead.tenant.metaAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: lead.phoneNumber,
          type: 'text',
          text: { body },
        }),
      });

      const metaData = await metaResponse.json();
      if (!metaResponse.ok) {
        throw new Error(metaData.error?.message || 'Meta API transmission failed');
      }
      messageId = metaData.messages?.[0]?.id || messageId;
    }

    const savedMessage = await prisma.message.create({
      data: {
        messageId,
        leadId: lead.id,
        body,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        direction: 'OUTBOUND'
      }
    });

    try {
      const { io } = require('../index');
      if (io) {
        io.to(`tenant:${tenantId}`).emit('new_message', { leadId: lead.id, message: savedMessage });
      }
    } catch (e) {
      console.warn('Socket broadcast warning:', e.message);
    }

    res.status(200).json({ success: true, data: savedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send message' });
  }
});

// PUT: Update lead status, assignee, or metadata
router.put('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const { status, category, assignedToId, tags, name } = req.body;

    const updateData = {
      ...(status && { status }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(name && { name }),
      updatedAt: new Date()
    };

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId === '' ? null : assignedToId;
    }

    const updatedLead = await prisma.lead.updateMany({
      where: { id: req.params.id, tenantId },
      data: updateData
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, data: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// POST: Add follow-up activity to a lead
router.post('/:id/followups', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const { type, note, dueAt } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId }
    });

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const followup = await prisma.followup.create({
      data: {
        leadId: req.params.id,
        type: type || 'CALL',
        note: note || '',
        dueAt: dueAt ? new Date(dueAt) : null,
      }
    });

    await prisma.lead.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    console.error('Error creating followup:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule follow-up' });
  }
});

// DELETE: Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    await prisma.lead.deleteMany({
      where: { id: req.params.id, tenantId }
    });

    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');

// GET: Fetch all leads for current tenant with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;

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

// GET: Fetch single lead by ID
router.get('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        assignedTo: { select: { id: true, email: true, role: true } },
      }
    });

    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

// PUT: Update lead
router.put('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;
    const { status, category, assignedToId, tags, name } = req.body;

    const updatedLead = await prisma.lead.updateMany({
      where: { id: req.params.id, tenantId },
      data: {
        ...(status && { status }),
        ...(category !== undefined && { category }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(tags !== undefined && { tags }),
        ...(name && { name }),
        updatedAt: new Date()
      }
    });

    res.status(200).json({ success: true, data: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

// DELETE: Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;

    await prisma.lead.deleteMany({
      where: { id: req.params.id, tenantId }
    });

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

module.exports = router;

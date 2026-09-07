const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET: Fetch all pipelines
router.get('/', async (req, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { tenantId: req.user.tenantId },
      include: { stages: { orderBy: { position: 'asc' } } }
    });
    res.status(200).json({ success: true, data: pipelines });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pipelines' });
  }
});

// POST: Create a new pipeline with default stages (ADMIN & TEAM_LEAD only)
router.post('/', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { name } = req.body;
    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        tenantId: req.user.tenantId,
        stages: {
          create: [
            { name: 'Lead In', position: 0, color: '#94a3b8' },
            { name: 'Contact Made', position: 1, color: '#3b82f6' },
            { name: 'Proposal Sent', position: 2, color: '#eab308' },
            { name: 'Won', position: 3, color: '#22c55e' },
            { name: 'Lost', position: 4, color: '#ef4444' }
          ]
        }
      },
      include: { stages: true }
    });
    res.status(201).json({ success: true, data: pipeline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create pipeline' });
  }
});

// PUT: Rename pipeline (ADMIN & TEAM_LEAD only)
router.put('/:id', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { name } = req.body;
    const pipeline = await prisma.pipeline.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { name }
    });
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update pipeline' });
  }
});

// DELETE: Delete pipeline (ADMIN & TEAM_LEAD only)
router.delete('/:id', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    await prisma.pipeline.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.status(200).json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete pipeline' });
  }
});

// GET: Fetch stages for a pipeline
router.get('/:id/stages', async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId: req.params.id, pipeline: { tenantId: req.user.tenantId } },
      orderBy: { position: 'asc' }
    });
    res.status(200).json({ success: true, data: stages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stages' });
  }
});

// PUT: Bulk update stages (ADMIN & TEAM_LEAD only)
router.put('/:id/stages', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const { stages } = req.body;
    await prisma.$transaction(
      stages.map((stage) =>
        prisma.pipelineStage.update({
          where: { id: stage.id, pipelineId: req.params.id, pipeline: { tenantId: req.user.tenantId } },
          data: { name: stage.name, position: stage.position, color: stage.color }
        })
      )
    );
    res.status(200).json({ success: true, message: 'Stages updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update stages' });
  }
});

// GET: Fetch deals for a pipeline
router.get('/:id/deals', async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { pipelineId: req.params.id, tenantId: req.user.tenantId },
      include: { lead: true, assignedTo: { select: { id: true, email: true } } }
    });
    res.status(200).json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch deals' });
  }
});

// POST: Create a deal
router.post('/:id/deals', async (req, res) => {
  try {
    const { stageId, title, value, currency, notes, expectedCloseDate, leadId, assignedToId } = req.body;
    const deal = await prisma.deal.create({
      data: {
        title,
        value: value || 0,
        currency: currency || 'USD',
        notes,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        leadId,
        assignedToId,
        stageId,
        pipelineId: req.params.id,
        tenantId: req.user.tenantId
      },
      include: { lead: true, assignedTo: { select: { id: true, email: true } } }
    });
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create deal' });
  }
});

module.exports = router;

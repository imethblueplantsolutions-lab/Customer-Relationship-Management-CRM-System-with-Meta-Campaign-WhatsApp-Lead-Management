const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET: List flows
router.get('/', async (req, res) => {
  try {
    const flows = await prisma.flow.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: flows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch flows' });
  }
});

// POST: Create flow
router.post('/', async (req, res) => {
  try {
    const { name, description, triggerType } = req.body;
    const flow = await prisma.flow.create({
      data: {
        name,
        description,
        triggerType: triggerType || 'keyword',
        tenantId: req.user.tenantId
      }
    });
    res.status(201).json({ success: true, data: flow });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create flow' });
  }
});

// GET: Get flow + nodes
router.get('/:id', async (req, res) => {
  try {
    const flow = await prisma.flow.findUnique({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: { nodes: true }
    });
    if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });
    res.status(200).json({ success: true, data: flow });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch flow details' });
  }
});

// PUT: Update flow metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, description, triggerType, triggerConfig, entryNodeId } = req.body;
    const flow = await prisma.flow.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { name, description, triggerType, triggerConfig, entryNodeId }
    });
    res.status(200).json({ success: true, data: flow });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update flow' });
  }
});

// PUT: Bulk save nodes (canvas state)
router.put('/:id/nodes', async (req, res) => {
  try {
    const { nodes } = req.body; // Expects array of node objects
    const flowId = req.params.id;
    const tenantId = req.user.tenantId;

    // Verify flow belongs to tenant
    const flow = await prisma.flow.findUnique({ where: { id: flowId, tenantId } });
    if (!flow) return res.status(404).json({ success: false, error: 'Flow not found' });

    // Transaction to replace all nodes safely
    await prisma.$transaction([
      prisma.flowNode.deleteMany({ where: { flowId } }),
      prisma.flowNode.createMany({
        data: nodes.map(n => ({
          flowId,
          nodeKey: n.nodeKey,
          nodeType: n.nodeType,
          config: n.config || {},
          posX: n.posX || 0,
          posY: n.posY || 0
        }))
      })
    ]);

    res.status(200).json({ success: true, message: 'Nodes saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save nodes' });
  }
});

// DELETE: Delete flow
router.delete('/:id', async (req, res) => {
  try {
    await prisma.flow.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.status(200).json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete flow' });
  }
});

// POST: Activate flow
router.post('/:id/activate', async (req, res) => {
  try {
    const flow = await prisma.flow.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: 'active' }
    });
    res.status(200).json({ success: true, data: flow });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to activate flow' });
  }
});

// POST: Deactivate flow
router.post('/:id/deactivate', async (req, res) => {
  try {
    const flow = await prisma.flow.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { status: 'draft' }
    });
    res.status(200).json({ success: true, data: flow });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate flow' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// PUT: Update deal (move stage, edit fields)
router.put('/:id', async (req, res) => {
  try {
    const { stageId, title, value, currency, notes, expectedCloseDate, assignedToId, status } = req.body;
    
    const updateData = {};
    if (stageId) updateData.stageId = stageId;
    if (title) updateData.title = title;
    if (value !== undefined) updateData.value = value;
    if (currency) updateData.currency = currency;
    if (notes !== undefined) updateData.notes = notes;
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (status) updateData.status = status;

    const deal = await prisma.deal.update({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData,
      include: { lead: true, assignedTo: { select: { id: true, email: true } } }
    });
    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update deal' });
  }
});

// DELETE: Delete deal (ADMIN & TEAM_LEAD only)
router.delete('/:id', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    await prisma.deal.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.status(200).json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete deal' });
  }
});

module.exports = router;


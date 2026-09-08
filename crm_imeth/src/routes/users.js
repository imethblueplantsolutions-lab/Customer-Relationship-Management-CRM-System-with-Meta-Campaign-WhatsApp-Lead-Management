const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');
const { authorize } = require('../middleware/auth');

// GET: Fetch all active users/agents in the current tenant (Admins & Team Leads only)
router.get('/', authorize(['ADMIN', 'TEAM_LEAD']), async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

module.exports = router;


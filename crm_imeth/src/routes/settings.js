const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { tenantStorage } = require('../middleware/tenant');

// Middleware to restrict settings to ADMIN, TEAM_LEAD, and SUPER_ADMIN
const authorizeAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || !user.role) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
  }
  if (user.role === 'SUPER_ADMIN' || ['ADMIN', 'TEAM_LEAD'].includes(user.role)) {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
};

// GET /api/settings - Fetch current tenant configuration
router.get('/', authorizeAdmin, async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        wabaId: true,
        metaPhoneNumberId: true,
        metaAccessToken: true,
        createdAt: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant settings not found' });
    }

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
});

// PUT /api/settings - Update tenant Meta API credentials
router.put('/', authorizeAdmin, async (req, res) => {
  try {
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const { name, wabaId, metaPhoneNumberId, metaAccessToken } = req.body;

    const cleanWabaId = wabaId !== undefined ? (typeof wabaId === 'string' && wabaId.trim() ? wabaId.trim() : null) : undefined;
    const cleanPhoneId = metaPhoneNumberId !== undefined ? (typeof metaPhoneNumberId === 'string' && metaPhoneNumberId.trim() ? metaPhoneNumberId.trim() : null) : undefined;
    const cleanToken = metaAccessToken !== undefined ? (typeof metaAccessToken === 'string' && metaAccessToken.trim() ? metaAccessToken.trim() : null) : undefined;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name && typeof name === 'string' && { name: name.trim() }),
        ...(cleanWabaId !== undefined && { wabaId: cleanWabaId }),
        ...(cleanPhoneId !== undefined && { metaPhoneNumberId: cleanPhoneId }),
        ...(cleanToken !== undefined && { metaAccessToken: cleanToken })
      }
    });

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        wabaId: updatedTenant.wabaId,
        metaPhoneNumberId: updatedTenant.metaPhoneNumberId,
        metaAccessToken: updatedTenant.metaAccessToken ? '••••••••' : null
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

/**
 * GET /api/tenant/profile
 * Returns company profile (Company Name & Address) for the authenticated tenant.
 * Accessible by all authenticated tenant members (ADMIN, TEAM_LEAD, AGENT, SUPER_ADMIN).
 */
router.get('/profile', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing from session' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        companyAddress: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Company profile not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        companyName: tenant.name || '',
        companyAddress: tenant.companyAddress || '',
        createdAt: tenant.createdAt,
      },
    });
  } catch (error) {
    console.error('[Tenant API] Fetch company profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve company profile' });
  }
});

/**
 * PUT /api/tenant/profile
 * Updates company profile (Company Name & Address).
 * Restricted strictly to ADMIN and SUPER_ADMIN.
 */
router.put('/profile', requireRoles('ADMIN'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing from session' });
    }

    const { companyName, companyAddress } = req.body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return res.status(400).json({ success: false, error: 'Company Name is required' });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: companyName.trim(),
        companyAddress: typeof companyAddress === 'string' ? companyAddress.trim() : null,
      },
      select: {
        id: true,
        name: true,
        companyAddress: true,
        createdAt: true,
      },
    });

    // Best effort AuditLog entry
    try {
      if (req.user?.userId || req.user?.id) {
        await prisma.auditLog.create({
          data: {
            action: 'TENANT_PROFILE_UPDATED',
            performedById: req.user.userId || req.user.id,
            tenantId,
            details: {
              companyName: updated.name,
              hasAddress: Boolean(updated.companyAddress),
            },
          },
        });
      }
    } catch (auditErr) {
      console.warn('[Tenant API] AuditLog record skipped:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: {
        id: updated.id,
        companyName: updated.name,
        companyAddress: updated.companyAddress || '',
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('[Tenant API] Update company profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update company profile' });
  }
});

module.exports = router;

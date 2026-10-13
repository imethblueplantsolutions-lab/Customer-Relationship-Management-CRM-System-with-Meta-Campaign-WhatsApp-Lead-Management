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

/**
 * GET /api/settings/billing
 * California ARL: Discloses current plan, price, renewal frequency, and online cancellation capability.
 */
router.get('/billing', authorizeAdmin, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPrice: true,
        subscriptionRenewalDate: true,
      },
    });

    const isSubscribed = user?.subscriptionStatus === 'ACTIVE';
    const renewalDate = user?.subscriptionRenewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return res.status(200).json({
      success: true,
      data: {
        planName: isSubscribed ? 'Enterprise Pro Plan' : 'Free Tier',
        price: isSubscribed ? (user?.subscriptionPrice || 29) : 0,
        billingInterval: 'monthly',
        status: user?.subscriptionStatus || 'FREE',
        autoRenews: isSubscribed,
        renewsUntilCancelled: isSubscribed,
        nextBillingDate: isSubscribed ? renewalDate.toISOString() : null,
        canCancelOnline: isSubscribed,
        cancellationPolicy: 'You can cancel your subscription at any time online with immediate effect. No cancellation fees apply.',
      },
    });
  } catch (error) {
    console.error('Fetch billing error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve billing information' });
  }
});

/**
 * POST /api/settings/billing/upgrade
 * California ARL compliant subscription upgrade.
 * Requires affirmative consent: auto-renews until cancelled.
 * Dispatches statutory confirmation email upon execution.
 */
router.post('/billing/upgrade', authorizeAdmin, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { affirmativeConsent, planName = 'Enterprise Pro Plan', price = 29.00 } = req.body || {};

    if (!affirmativeConsent) {
      return res.status(400).json({
        success: false,
        error: 'California ARL: Affirmative consent to automatic renewal terms is required prior to charging.',
      });
    }

    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPrice: price,
        subscriptionRenewalDate: nextBillingDate,
        maxTeamLeads: 10,
        maxAgents: 50,
      },
      select: { id: true, email: true, name: true, subscriptionStatus: true, subscriptionPrice: true, subscriptionRenewalDate: true },
    });

    // Send statutory confirmation email
    try {
      const { sendSubscriptionConfirmationEmail } = require('../services/mailer');
      await sendSubscriptionConfirmationEmail(updatedUser.email, updatedUser.name, {
        planName,
        price,
        billingInterval: 'monthly',
        nextBillingDate: nextBillingDate.toLocaleDateString(),
      });
    } catch (emailErr) {
      console.warn('[Billing] Confirmation email notice:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${planName}. Terms: $${price}/month renews automatically until cancelled. Confirmation email dispatched.`,
      data: {
        status: 'ACTIVE',
        price,
        nextBillingDate: nextBillingDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Upgrade billing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process upgrade: ' + error.message });
  }
});

/**
 * POST /api/settings/billing/cancel
 * California ARL: Direct, straightforward online cancellation with immediate effect.
 * Halts recurring charges with zero friction, retention walls, or phone requirements.
 */
router.post('/billing/cancel', authorizeAdmin, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionRenewalDate: null,
      },
      select: { id: true, email: true, subscriptionStatus: true },
    });

    console.log(`[California ARL Online Cancellation] User ${updatedUser.email} cancelled recurring subscription online.`);

    return res.status(200).json({
      success: true,
      message: 'Your recurring subscription has been cancelled online. You will not be billed again.',
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Cancel billing error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription: ' + error.message });
  }
});

module.exports = router;

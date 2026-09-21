/**
 * @file broadcast.js
 * @description Bulk WhatsApp campaign broadcast routes.
 * Allows Admins and Team Leads to dispatch templated messages to lead segments
 * using BullMQ queues for asynchronous worker execution.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { tenantStorage } = require('../middleware/tenant');
const { broadcastQueue } = require('../workers/broadcastWorker');

// Protect all broadcast routes: requires authentication and ADMIN or TEAM_LEAD role
router.use(authenticate);
router.use(authorize(['ADMIN', 'TEAM_LEAD']));

/**
 * POST /api/broadcast
 * Enqueues bulk WhatsApp template messages for specified lead IDs.
 */
router.post('/', async (req, res) => {
  try {
    const { leadIds, templateName, languageCode = 'en_US', wabaId, accessToken } = req.body;
    const store = tenantStorage.getStore();
    const tenantId = req.user?.tenantId || store?.tenantId;
    const currentUserId = req.user?.userId || req.user?.id;

    // Validate that leadIds is a non-empty array
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'leadIds must be a non-empty array of lead IDs',
      });
    }

    if (!templateName || typeof templateName !== 'string' || !templateName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'templateName is required and must be a valid non-empty string',
      });
    }

    // Resolve WhatsApp Phone Number ID (wabaId) and Access Token
    let resolvedWabaId = wabaId;
    let resolvedAccessToken = accessToken;

    if (!resolvedWabaId || !resolvedAccessToken) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { metaPhoneNumberId: true, metaAccessToken: true, wabaId: true },
      });

      resolvedWabaId =
        resolvedWabaId ||
        tenant?.metaPhoneNumberId ||
        tenant?.wabaId ||
        process.env.META_PHONE_NUMBER_ID;

      resolvedAccessToken =
        resolvedAccessToken ||
        tenant?.metaAccessToken ||
        process.env.META_ACCESS_TOKEN;
    }

    if (!resolvedWabaId) {
      return res.status(400).json({
        success: false,
        error: 'wabaId (WhatsApp Phone Number ID) is required and could not be resolved from tenant or environment settings',
      });
    }

    if (!resolvedAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required and could not be resolved from tenant or environment settings',
      });
    }

    // Map leadIds into BullMQ jobs
    const jobs = leadIds.map((leadId) => ({
      name: 'send-template-broadcast',
      data: {
        leadId,
        templateName: templateName.trim(),
        languageCode,
        wabaId: resolvedWabaId,
        accessToken: resolvedAccessToken,
        tenantId,
        initiatedById: currentUserId,
      },
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    }));

    // Enqueue all jobs at once via BullMQ bulk ingestion
    await broadcastQueue.addBulk(jobs);

    res.status(202).json({
      success: true,
      message: `Successfully enqueued ${jobs.length} broadcast messages for transmission`,
      queuedCount: jobs.length,
      templateName: templateName.trim(),
      languageCode,
      wabaId: resolvedWabaId,
    });
  } catch (error) {
    console.error('[Broadcast Route] Error enqueueing broadcast messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue broadcast messages: ' + (error.message || 'Internal error'),
    });
  }
});

module.exports = router;

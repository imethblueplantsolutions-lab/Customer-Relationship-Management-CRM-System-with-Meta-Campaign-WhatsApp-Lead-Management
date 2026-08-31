const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Webhook Verification (Meta Handshake)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_VERIFY_TOKEN || 'test_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook] Verification successful!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook] Verification failed - Token mismatch');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
});

// Inbound WhatsApp Webhook Receiver
router.post('/', async (req, res) => {
  // Acknowledge Meta immediately to avoid timeouts
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value || !value.messages) continue;

        const contacts = value.contacts || [];
        const contactMap = {};
        contacts.forEach(c => {
          contactMap[c.wa_id] = c.profile ? c.profile.name : null;
        });

        for (const message of value.messages) {
          const fromNumber = message.from;
          const messageId = message.id;
          const timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date();
          const messageBody = message.text?.body || (message.type ? `[${message.type}]` : '[Message]');
          const customerName = contactMap[fromNumber] || fromNumber;
          const referral = message.referral || null;

          // Check if message already processed (idempotency)
          const existingMsg = await prisma.message.findUnique({
            where: { messageId }
          });
          if (existingMsg) {
            console.log(`[Webhook] Duplicate message ${messageId} ignored.`);
            continue;
          }

          // Find or create lead
          let lead = await prisma.lead.findUnique({
            where: { phoneNumber: fromNumber }
          });

          if (!lead) {
            // New Lead creation
            lead = await prisma.lead.create({
              data: {
                phoneNumber: fromNumber,
                name: customerName,
                status: 'NEW',
                sourceChannel: referral ? 'Meta CTWA Ad' : 'WhatsApp Direct',
                lastActivityAt: timestamp,
                attribution: referral ? {
                  create: {
                    sourceUrl: referral.source_url || null,
                    adId: referral.source_id || null,
                    sourceType: referral.source_type || 'ad',
                    headline: referral.headline || null,
                    body: referral.body || null,
                    ctwaClid: referral.ctwa_clid || null,
                    capturedAt: timestamp
                  }
                } : undefined
              }
            });

            // Log Audit
            await prisma.auditLog.create({
              data: {
                leadId: lead.id,
                action: 'LEAD_AUTO_CAPTURED',
                details: { source: 'WhatsApp Webhook', referral }
              }
            });
            console.log(`[Webhook] New Lead captured: ${lead.name} (${lead.phoneNumber})`);
          } else {
            // Update last activity
            await prisma.lead.update({
              where: { id: lead.id },
              data: { lastActivityAt: timestamp }
            });
          }

          // Save Message to thread
          await prisma.message.create({
            data: {
              messageId,
              leadId: lead.id,
              direction: 'INBOUND',
              body: messageBody,
              timestamp,
              rawPayload: message
            }
          });

          console.log(`[Webhook] Stored message for Lead ${lead.id}: "${messageBody}"`);
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Error processing incoming payload:', error);
  }
});

module.exports = router;

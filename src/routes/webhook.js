const express = require('express');
const router = express.Router();
const webhookQueue = require('../queues/webhookQueue');

// GET: Meta Webhook Verification Handshake
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'test_token')) {
    console.log('[Webhook] Verification handshake successful');
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Verification failed' });
});

// High-throughput entry point: 200 OK within 5ms
router.post('/', async (req, res) => {
  // 1. Immediately acknowledge receipt to Meta to prevent timeout penalties
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (!body.object || body.object !== 'whatsapp_business_account') return;

  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      const tenantId = entry.id; // Resolving WABA_ID as Tenant
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;
        if (!value || !value.messages) continue;

        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          const contact = contacts.find(c => c.wa_id === message.from) || contacts[i] || { wa_id: message.from, profile: { name: message.from } };

          await webhookQueue.add('process-message', {
            tenantId,
            message,
            contact,
            referral: message.referral || null
          });
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Ingestion error:', error);
  }
});

module.exports = router;

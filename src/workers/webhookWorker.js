const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');

const webhookWorker = new Worker('webhook-ingestion', async (job) => {
  // Lazy require io to avoid circular dependencies
  const { io } = require('../index');

  const { tenantId, message, contact, referral } = job.data;
  const messageId = message.id;
  const phoneNumber = contact?.wa_id || message.from;
  const customerName = contact?.profile?.name || phoneNumber;
  const messageBody = message.text?.body || (message.type ? `[${message.type}]` : '[Message]');
  const timestamp = message.timestamp || Math.floor(Date.now() / 1000).toString();

  // 1. Redis De-duplication Lock
  const isNewMessage = await CacheService.checkAndSetLock(`msg_lock:${messageId}`, 3600);
  if (!isNewMessage) {
    console.log(`[Worker] Duplicate message discarded: ${messageId}`);
    return;
  }

  // 2. Ensure Tenant exists in Postgres
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: `Tenant ${tenantId}`,
      wabaId: tenantId
    }
  });

  // 3. Persist / Upsert Lead in PostgreSQL
  const lead = await prisma.lead.upsert({
    where: { 
      tenantId_phoneNumber: { tenantId, phoneNumber } 
    },
    update: { 
      name: customerName,
      updatedAt: new Date() 
    },
    create: {
      tenantId,
      phoneNumber,
      name: customerName,
      status: 'NEW',
      category: referral ? 'Meta Ad' : 'Organic',
    }
  });

  // 4. If CTWA Referral attribution exists and not yet saved, save it
  if (referral) {
    const existingAttr = await prisma.campaignAttribution.findUnique({
      where: { leadId: lead.id }
    });
    if (!existingAttr) {
      await prisma.campaignAttribution.create({
        data: {
          leadId: lead.id,
          sourceUrl: referral.source_url || null,
          adId: referral.source_id || referral.ad_id || null,
          sourceType: referral.source_type || 'ad',
          headline: referral.headline || null,
          body: referral.body || null,
          ctwaClid: referral.ctwa_clid || null
        }
      });
    }
  }

  // 5. Store message in message history
  const savedMessage = await prisma.message.upsert({
    where: { messageId },
    update: {},
    create: {
      messageId,
      leadId: lead.id,
      direction: 'INBOUND',
      body: messageBody,
      timestamp: timestamp.toString()
    }
  });

  console.log(`[Worker] Processed message & lead: ${lead.name} (${lead.phoneNumber}) for Tenant: ${tenantId}`);

  // 6. Invalidate Dashboard Cache for this tenant
  await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

  // 7. Broadcast real-time event to the tenant's WebSocket room
  if (io) {
    io.to(`tenant:${tenantId}`).emit('new_message', {
      leadId: lead.id,
      message: savedMessage,
      lead: {
        id: lead.id,
        name: lead.name,
        phoneNumber: lead.phoneNumber,
        status: lead.status
      }
    });
    console.log(`📡 [Worker] Broadcasted 'new_message' to room tenant:${tenantId}`);
  }

}, { connection: redisClient, concurrency: 25 });

webhookWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

webhookWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

module.exports = webhookWorker;

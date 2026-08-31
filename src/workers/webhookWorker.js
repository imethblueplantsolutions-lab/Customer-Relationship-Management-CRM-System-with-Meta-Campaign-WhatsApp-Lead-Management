const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');

const webhookWorker = new Worker('webhook-ingestion', async (job) => {
  const { tenantId, message, contact, referral } = job.data;
  const messageId = message.id;
  const phoneNumber = contact?.wa_id || message.from;
  const customerName = contact?.profile?.name || phoneNumber;

  // 1. Redis De-duplication Lock
  const isNewMessage = await CacheService.checkAndSetLock(`msg_lock:${messageId}`, 3600);
  if (!isNewMessage) {
    console.log(`[Worker] Duplicate message discarded: ${messageId}`);
    return;
  }

  // 2. Ensure Tenant exists in Postgres (prevent foreign key violation)
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: `Tenant ${tenantId}`,
      wabaId: tenantId
    }
  });

  // 3. Persist Lead to PostgreSQL
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

  console.log(`[Worker] Successfully processed lead: ${lead.name} (${lead.phoneNumber}) for Tenant: ${tenantId}`);

  // 4. Invalidate Dashboard Cache for this tenant
  await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

}, { connection: redisClient, concurrency: 25 });

webhookWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

webhookWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

module.exports = webhookWorker;

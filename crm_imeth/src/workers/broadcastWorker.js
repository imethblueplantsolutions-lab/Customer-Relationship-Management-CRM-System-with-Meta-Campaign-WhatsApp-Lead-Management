const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const redisClient = require('../config/redis');
const prisma = require('../config/db');

// 1. Initialize BullMQ Queue for Template Broadcasting
const broadcastQueue = new Queue('broadcast-queue', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: 500,
  },
});

// 2. Initialize BullMQ Worker with Rate Limiting (max 15 msgs / second)
const broadcastWorker = new Worker(
  'broadcast-queue',
  async (job) => {
    const {
      leadId,
      templateName,
      languageCode = 'en_US',
      wabaId,
      accessToken,
      tenantId,
      initiatedById,
    } = job.data;

    if (!leadId) {
      throw new Error(`Job ${job.id} missing required parameter: leadId`);
    }

    if (!templateName) {
      throw new Error(`Job ${job.id} missing required parameter: templateName`);
    }

    if (!wabaId) {
      throw new Error(`Job ${job.id} missing required parameter: wabaId`);
    }

    if (!accessToken) {
      throw new Error(`Job ${job.id} missing required parameter: accessToken`);
    }

    // Fetch the lead's phone number and verification status
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        tenantId: true,
      },
    });

    if (!lead || !lead.phoneNumber) {
      throw new Error(`Lead record not found or missing phone number for leadId: ${leadId}`);
    }

    // Format phone number (remove + or whitespace if present)
    const formattedPhone = lead.phoneNumber.replace(/[^\d]/g, '');

    // Construct Meta WhatsApp Cloud API URL and payload
    const metaApiUrl = `https://graph.facebook.com/v19.0/${wabaId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    // Dispatch message via Axios with Bearer token authentication
    const response = await axios.post(metaApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const metaMessageId = response.data?.messages?.[0]?.id || 'N/A';

    // Record outbound message in database for conversation history
    if (metaMessageId !== 'N/A') {
      try {
        await prisma.message.upsert({
          where: { messageId: metaMessageId },
          update: {},
          create: {
            messageId: metaMessageId,
            leadId: lead.id,
            direction: 'OUTBOUND',
            source: 'CRM',
            body: `[Broadcast Template: ${templateName}]`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
          },
        });
      } catch (msgErr) {
        console.warn(`[BroadcastWorker] Failed to record message history for lead ${lead.id}:`, msgErr.message);
      }
    }

    // Create Activity audit log for the lead
    const activity = await prisma.activity.create({
      data: {
        leadId: lead.id,
        createdById: initiatedById || null,
        type: 'BROADCAST',
        title: 'Broadcast Template Sent',
        description: `Template "${templateName}" (${languageCode}) dispatched to ${lead.phoneNumber}. Meta Message ID: ${metaMessageId}`,
      },
    });

    // Real-time notification broadcast via Socket.IO if available
    try {
      const { io } = require('../index');
      const targetTenant = tenantId || lead.tenantId;
      if (io && targetTenant) {
        io.to(`tenant:${targetTenant}`).emit('new_activity', {
          leadId: lead.id,
          activity,
        });
      }
    } catch (socketErr) {
      // Non-blocking socket emission
    }

    return {
      leadId: lead.id,
      metaMessageId,
      status: 'SENT',
    };
  },
  {
    connection: redisClient,
    concurrency: 15,
    limiter: {
      max: 15,
      duration: 1000,
    },
  }
);

// Worker Lifecycle Listeners
broadcastWorker.on('completed', (job, result) => {
  console.log(`[BroadcastWorker] Job ${job.id} completed: Meta Message ID ${result?.metaMessageId} for lead ${result?.leadId}`);
});

broadcastWorker.on('failed', (job, err) => {
  console.error(`[BroadcastWorker] Job ${job?.id} failed for lead ${job?.data?.leadId} (attempt ${job?.attemptsMade}):`, err.message);
});

module.exports = {
  broadcastQueue,
  broadcastWorker,
};

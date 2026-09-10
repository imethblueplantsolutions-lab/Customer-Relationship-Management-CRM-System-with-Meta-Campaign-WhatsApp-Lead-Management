const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const prisma = require('../config/db');
const CacheService = require('../services/cacheService');
const { getRoundRobinAgent } = require('../utils/assignment');
const { downloadMetaMedia } = require('../utils/metaMedia');

/**
 * Resolves a valid User ID to associate as the creator of an incoming media Attachment.
 * Checks for assigned agent first, falls back to any user in tenant, or upserts a system user.
 *
 * @param {object} tx - Prisma transaction client
 * @param {string} tenantId - Tenant ID
 * @param {string|null} preferredUserId - Preferred User ID (e.g. assignedToId)
 * @returns {Promise<string>}
 */
async function resolveUploaderUserId(tx, tenantId, preferredUserId) {
  if (preferredUserId) {
    const userExists = await tx.user.findFirst({
      where: { id: preferredUserId, tenantId },
      select: { id: true },
    });
    if (userExists) return userExists.id;
  }

  // Fallback 1: Any existing user in this tenant
  const tenantUser = await tx.user.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (tenantUser) return tenantUser.id;

  // Fallback 2: Upsert a system user for automated media uploads
  const systemEmail = `system_${tenantId}@crm.internal`;
  const systemUser = await tx.user.upsert({
    where: { email: systemEmail },
    update: {},
    create: {
      email: systemEmail,
      password: 'SYSTEM_AUTOMATED_ACCOUNT_HASH',
      role: 'ADMIN',
      tenantId,
      name: 'System User',
    },
    select: { id: true },
  });
  return systemUser.id;
}

const webhookWorker = new Worker('webhook-ingestion', async (job) => {
  // Lazy require io to avoid circular dependencies
  const { io } = require('../index');

  // =========================================================================
  // CASE 1: WHATSAPP COEXISTENCE ECHO (Outbound reply from Mobile App)
  // =========================================================================
  if (job.name === 'process-echo') {
    const { tenantId, echo, metadata } = job.data;
    const messageId = echo.id;
    // In Coexistence echoes, echo.to is the recipient (the lead / customer)
    const customerPhone = echo.to;
    const timestamp = echo.timestamp || Math.floor(Date.now() / 1000).toString();

    if (!customerPhone) {
      console.warn('[Worker] Coexistence echo missing recipient (to):', echo);
      return;
    }

    // 1. Redis De-duplication Lock
    const isNewEcho = await CacheService.checkAndSetLock(`msg_lock:${messageId}`, 3600);
    if (!isNewEcho) {
      console.log(`[Worker] Duplicate echo discarded: ${messageId}`);
      return;
    }

    // 2. Media Extraction & Binary Download (defensive try/catch)
    const mediaPayload = echo.image || echo.audio || echo.document || echo.video || echo.voice || echo.sticker;
    let downloadedAttachment = null;

    if (mediaPayload?.id) {
      try {
        const metaToken = process.env.META_ACCESS_TOKEN;
        downloadedAttachment = await downloadMetaMedia(mediaPayload.id, metaToken);
        console.log(`[Worker] Downloaded echo media ${mediaPayload.id} -> ${downloadedAttachment.fileUrl}`);
      } catch (mediaError) {
        console.error(`[Worker] Transient error downloading echo media ${mediaPayload.id}:`, mediaError.message || mediaError);
      }
    }

    // 3. Defensive message body extraction across media, text, reactions, revoked
    let messageBody = '[Unsupported Message]';
    if (downloadedAttachment) {
      if (echo.image) {
        messageBody = echo.image.caption
          ? `📷 [Image] ${echo.image.caption} (${downloadedAttachment.fileUrl})`
          : `📷 [Image] ${downloadedAttachment.fileName} (${downloadedAttachment.fileUrl})`;
      } else if (echo.document) {
        const docName = echo.document.filename || downloadedAttachment.fileName;
        messageBody = echo.document.caption
          ? `📄 [Document] ${docName} - ${echo.document.caption} (${downloadedAttachment.fileUrl})`
          : `📄 [Document] ${docName} (${downloadedAttachment.fileUrl})`;
      } else if (echo.audio || echo.voice) {
        messageBody = `🎵 [Audio message] ${downloadedAttachment.fileName} (${downloadedAttachment.fileUrl})`;
      } else if (echo.video) {
        messageBody = echo.video.caption
          ? `🎥 [Video] ${echo.video.caption} (${downloadedAttachment.fileUrl})`
          : `🎥 [Video] ${downloadedAttachment.fileName} (${downloadedAttachment.fileUrl})`;
      } else if (echo.sticker) {
        messageBody = `🏷️ [Sticker] ${downloadedAttachment.fileName} (${downloadedAttachment.fileUrl})`;
      }
    } else if (echo.text?.body) {
      messageBody = echo.text.body;
    } else if (echo.type) {
      if (echo.image) {
        messageBody = echo.image.caption ? `📷 [Image] ${echo.image.caption}` : '📷 [Image]';
      } else if (echo.document) {
        messageBody = echo.document.filename ? `📄 [Document] ${echo.document.filename}` : '📄 [Document]';
      } else if (echo.audio || echo.voice) {
        messageBody = '🎵 [Audio message]';
      } else if (echo.video) {
        messageBody = echo.video.caption ? `🎥 [Video] ${echo.video.caption}` : '🎥 [Video]';
      } else if (echo.sticker) {
        messageBody = '🏷️ [Sticker]';
      } else if (echo.reaction) {
        messageBody = `Reacted ${echo.reaction.emoji || ''}`;
      } else if (echo.type === 'revoke') {
        messageBody = '🚫 [Message revoked on WhatsApp Business App]';
      } else {
        messageBody = `[${echo.type}]`;
      }
    }

    // 4. Atomic Database Transaction with Prisma $transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure Tenant exists
      await tx.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
          id: tenantId,
          name: `Tenant ${tenantId}`,
          wabaId: tenantId
        }
      });

      // Find or upsert Lead by customer phone number
      const lead = await tx.lead.upsert({
        where: {
          tenantId_phoneNumber: { tenantId, phoneNumber: customerPhone }
        },
        update: {
          updatedAt: new Date()
        },
        create: {
          tenantId,
          phoneNumber: customerPhone,
          name: customerPhone,
          status: 'IN_PROGRESS',
          category: 'Organic'
        }
      });

      // Link Attachment record if media was downloaded
      let savedAttachment = null;
      if (downloadedAttachment) {
        const uploaderId = await resolveUploaderUserId(tx, tenantId, lead.assignedToId);
        savedAttachment = await tx.attachment.create({
          data: {
            fileName: mediaPayload.filename || downloadedAttachment.fileName,
            fileUrl: downloadedAttachment.fileUrl,
            fileType: downloadedAttachment.fileType,
            fileSize: downloadedAttachment.fileSize || 0,
            createdById: uploaderId,
            leadId: lead.id,
          },
        });
      }

      // Save Outbound Message with source: 'WHATSAPP_MOBILE'
      const savedMessage = await tx.message.upsert({
        where: { messageId },
        update: {
          body: messageBody,
          direction: 'OUTBOUND',
          source: 'WHATSAPP_MOBILE'
        },
        create: {
          messageId,
          leadId: lead.id,
          direction: 'OUTBOUND',
          source: 'WHATSAPP_MOBILE',
          body: messageBody,
          timestamp: timestamp.toString()
        }
      });

      // Create Activity record on Lead timeline
      const numericTimestamp = parseInt(timestamp, 10);
      const occurredDate = !isNaN(numericTimestamp) ? new Date(numericTimestamp * 1000) : new Date();

      const activity = await tx.activity.create({
        data: {
          leadId: lead.id,
          type: 'WHATSAPP_MOBILE_REPLY',
          title: 'Replied via WhatsApp Mobile App',
          description: messageBody,
          occurredAt: occurredDate
        }
      });

      return { lead, savedMessage, activity, savedAttachment };
    });

    console.log(`[Worker] Processed mobile echo for Lead: ${result.lead.phoneNumber} (${result.lead.id})`);

    // 5. Invalidate Dashboard Cache
    await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

    // 6. Socket.IO Real-time Broadcast to tenant room
    if (io) {
      io.to(`tenant:${tenantId}`).emit('new_message', {
        leadId: result.lead.id,
        message: result.savedMessage,
        lead: {
          id: result.lead.id,
          name: result.lead.name,
          phoneNumber: result.lead.phoneNumber,
          status: result.lead.status
        }
      });

      io.to(`tenant:${tenantId}`).emit('lead_activity_created', {
        leadId: result.lead.id,
        activity: result.activity
      });
      io.to(`tenant:${tenantId}`).emit('new_activity', {
        leadId: result.lead.id,
        activity: result.activity
      });

      console.log(`📡 [Worker] Broadcasted mobile echo 'new_message' & 'new_activity' to room tenant:${tenantId}`);
    }

    return;
  }

  // =========================================================================
  // CASE 3: WHATSAPP DELIVERY & READ RECEIPTS (statuses)
  // =========================================================================
  if (job.name === 'process-status') {
    const { statusObj, metadata, tenantId: jobTenantId } = job.data;
    const messageId = statusObj?.id;
    const deliveryStatus = statusObj?.status; // "sent" | "delivered" | "read" | "failed"

    if (!messageId || !deliveryStatus) {
      console.warn('[Worker] Missing messageId or deliveryStatus in process-status job:', statusObj);
      return;
    }

    try {
      // Find and update the message status
      const updatedMessage = await prisma.message.update({
        where: { messageId },
        data: { status: deliveryStatus },
        include: {
          lead: {
            select: {
              id: true,
              tenantId: true,
            },
          },
        },
      });

      const leadId = updatedMessage.leadId || updatedMessage.lead?.id;
      const tenantId = updatedMessage.lead?.tenantId || jobTenantId;

      console.log(`[Worker] Updated message ${messageId} delivery status to '${deliveryStatus}' (Lead: ${leadId}, Tenant: ${tenantId})`);

      // Emit Socket.IO event to the tenant room
      if (io && tenantId) {
        io.to(`tenant:${tenantId}`).emit('message_status_update', {
          messageId,
          status: deliveryStatus,
          leadId,
        });
        console.log(`📡 [Worker] Broadcasted 'message_status_update' (${deliveryStatus}) to room tenant:${tenantId}`);
      }
    } catch (err) {
      if (err.code === 'P2025') {
        console.warn(`[Worker] Message ${messageId} not found in database for status update: ${deliveryStatus}`);
        return;
      }
      console.error(`[Worker] Failed to update delivery status for message ${messageId}:`, err);
      throw err;
    }

    return;
  }

  // =========================================================================
  // CASE 2: INBOUND CUSTOMER MESSAGE
  // =========================================================================
  const { tenantId, message, contact, referral } = job.data;
  const messageId = message.id;
  const phoneNumber = contact?.wa_id || message.from;
  const customerName = contact?.profile?.name || phoneNumber;
  const timestamp = message.timestamp || Math.floor(Date.now() / 1000).toString();

  // 1. Redis De-duplication Lock
  const isNewMessage = await CacheService.checkAndSetLock(`msg_lock:${messageId}`, 3600);
  if (!isNewMessage) {
    console.log(`[Worker] Duplicate message discarded: ${messageId}`);
    return;
  }

  // 2. Media Extraction & Binary Download
  const mediaTypes = ['image', 'audio', 'document', 'video', 'voice'];
  const isMediaMessage = mediaTypes.includes(message.type);
  let downloadedAttachment = null;
  let mediaDownloadFailed = false;

  const mediaObj = isMediaMessage
    ? (message[message.type] || message.image || message.audio || message.document || message.video || message.voice)
    : null;
  const mediaId = mediaObj?.id;

  if (isMediaMessage && mediaId) {
    try {
      downloadedAttachment = await downloadMetaMedia(mediaId, process.env.META_ACCESS_TOKEN);
      console.log(`[Worker] Successfully downloaded inbound ${message.type} (${mediaId}) -> ${downloadedAttachment.fileUrl}`);
    } catch (mediaError) {
      mediaDownloadFailed = true;
      console.error(`[Worker] Failed to download inbound ${message.type} (${mediaId}):`, mediaError.message || mediaError);
    }
  }

  // 3. Determine Message Body
  let messageBody = message.text?.body || '';
  if (isMediaMessage) {
    if (downloadedAttachment) {
      const caption = mediaObj?.caption;
      const typeLabel = message.type.charAt(0).toUpperCase() + message.type.slice(1);
      messageBody = caption
        ? `${caption} [${typeLabel} Attached]`
        : `[${typeLabel} Attached]`;
    } else if (mediaDownloadFailed) {
      messageBody = '[Media Download Failed]';
    } else {
      messageBody = `[${message.type.toUpperCase()}]`;
    }
  } else if (!messageBody) {
    messageBody = message.type ? `[${message.type}]` : '[Message]';
  }

  // 4. Atomic Database Transaction with Prisma $transaction
  const transactionResult = await prisma.$transaction(async (tx) => {
    // Ensure Tenant exists in Postgres
    await tx.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        name: `Tenant ${tenantId}`,
        wabaId: tenantId
      }
    });

    // Check if lead already exists
    const existingLead = await tx.lead.findUnique({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber } },
      select: { id: true, name: true, assignedToId: true }
    });
    const isNewLead = !existingLead;
    const shouldUpdateName = !existingLead || existingLead.name === phoneNumber;

    // Determine round-robin agent assignment for newly captured leads
    let assignedAgentId = null;
    if (isNewLead) {
      assignedAgentId = await getRoundRobinAgent(tenantId);
    }

    const lead = await tx.lead.upsert({
      where: { 
        tenantId_phoneNumber: { tenantId, phoneNumber } 
      },
      update: { 
        ...(shouldUpdateName && { name: customerName }),
        updatedAt: new Date() 
      },
      create: {
        tenantId,
        phoneNumber,
        name: customerName,
        status: 'NEW',
        category: referral ? 'Meta Ad' : 'Organic',
        ...(assignedAgentId && { assignedToId: assignedAgentId }),
      }
    });

    // If CTWA Referral attribution exists and not yet saved, save it
    if (referral) {
      const existingAttr = await tx.campaignAttribution.findUnique({
        where: { leadId: lead.id }
      });
      if (!existingAttr) {
        await tx.campaignAttribution.create({
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

    // Link Attachment record if media was downloaded
    let savedAttachment = null;
    if (downloadedAttachment) {
      const uploaderId = await resolveUploaderUserId(tx, tenantId, lead.assignedToId);
      savedAttachment = await tx.attachment.create({
        data: {
          fileName: mediaPayload.filename || downloadedAttachment.fileName,
          fileUrl: downloadedAttachment.fileUrl,
          fileType: downloadedAttachment.fileType,
          fileSize: downloadedAttachment.fileSize || 0,
          createdById: uploaderId,
          leadId: lead.id,
        },
      });
    }

    // Store message in message history
    const savedMessage = await tx.message.upsert({
      where: { messageId },
      update: {
        body: messageBody,
      },
      create: {
        messageId,
        leadId: lead.id,
        direction: 'INBOUND',
        source: 'CUSTOMER',
        body: messageBody,
        timestamp: timestamp.toString()
      }
    });

    return { lead, savedMessage, isNewLead, assignedAgentId, savedAttachment };
  });

  const { lead, savedMessage, isNewLead, assignedAgentId } = transactionResult;

  // 5. If newly created and assigned to an agent, create Notification and emit real-time event
  if (isNewLead && assignedAgentId) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: assignedAgentId,
          type: 'LEAD_ASSIGNED',
          title: 'New Lead Assigned to You',
          body: `A new Meta WhatsApp lead (${customerName || phoneNumber}) was automatically assigned to you.`,
          linkUrl: `/leads/${lead.id}`,
        },
      });

      if (io) {
        io.to(`user:${assignedAgentId}`).emit('lead_assigned', {
          leadId: lead.id,
          leadName: customerName || phoneNumber,
          phoneNumber,
          assignedToId: assignedAgentId,
          notification,
        });
        io.to(`user:${assignedAgentId}`).emit('new_notification', notification);
        console.log(`📡 [Worker] Notified agent ${assignedAgentId} of auto-assigned lead ${lead.id}`);
      }
    } catch (notifErr) {
      console.warn('[Worker] Failed to create or emit notification for auto-assigned lead:', notifErr.message);
    }
  }

  // 6. Targeted Notification: Alert assigned Sales Agent of incoming message
  if (lead.assignedToId) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: lead.assignedToId,
          type: 'NEW_MESSAGE',
          title: 'New WhatsApp Message',
          message: 'New reply from ' + (lead.name || lead.phoneNumber),
          body: 'New reply from ' + (lead.name || lead.phoneNumber),
          linkUrl: `/leads/${lead.id}`,
        },
      });

      if (io) {
        io.to('user:' + lead.assignedToId).emit('new_notification', notification);
        console.log(`📡 [Worker] Dispatched 'new_notification' to user:${lead.assignedToId} for lead ${lead.id}`);
      }
    } catch (notifErr) {
      console.warn('[Worker] Failed to create or emit new message notification for assigned agent:', notifErr.message);
    }
  }

  console.log(`[Worker] Processed message & lead: ${lead.name} (${lead.phoneNumber}) for Tenant: ${tenantId}`);

  // 7. Invalidate Dashboard Cache for this tenant
  await CacheService.invalidatePattern(`tenant:${tenantId}:dashboard:*`);

  // 8. Broadcast real-time event to the tenant's WebSocket room
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

webhookWorker.on('failed', async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}):`, err);

  if (job && job.attemptsMade >= job.opts.attempts) {
    console.warn(`[Worker] Job ${job.id} exceeded all ${job.opts.attempts} attempts. Moving to Dead Letter Queue (FailedJob)...`);
    try {
      await prisma.failedJob.create({
        data: {
          jobId: String(job.id),
          queueName: job.queueName || 'webhook-ingestion',
          jobName: job.name,
          payload: job.data,
          error: err?.message || String(err) || 'Unknown worker execution failure',
          status: 'FAILED',
        },
      });
      console.log(`[Worker] Persisted failed job ${job.id} to FailedJob table.`);
    } catch (dbError) {
      console.error(`[Worker] Failed to persist Dead Letter Job ${job.id} to database:`, dbError);
    }
  }
});

module.exports = webhookWorker;

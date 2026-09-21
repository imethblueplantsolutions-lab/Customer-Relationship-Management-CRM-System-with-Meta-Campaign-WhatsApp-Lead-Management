/**
 * @file webhookQueue.js
 * @description BullMQ queue instance for incoming Meta and WhatsApp webhook ingestion.
 * Configured with exponential backoff (3 attempts, 5s initial delay) for resilient delivery.
 */

const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

const webhookQueue = new Queue('webhook-ingestion', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  }
});

module.exports = webhookQueue;

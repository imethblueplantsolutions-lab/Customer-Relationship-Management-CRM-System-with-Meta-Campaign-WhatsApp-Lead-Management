const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

const webhookQueue = new Queue('webhook-ingestion', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 100,
  }
});

module.exports = webhookQueue;

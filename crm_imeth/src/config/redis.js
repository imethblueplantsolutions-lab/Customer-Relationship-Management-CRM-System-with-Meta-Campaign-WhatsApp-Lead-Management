const Redis = require('ioredis');

let redisClient = null;
let redisAvailable = false;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️  Redis unavailable after 3 retries. Running without Redis (caching/queues disabled).');
        return null; // Stop retrying
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    console.log('✅ Connected to Redis successfully');
  });

  redisClient.on('error', (err) => {
    redisAvailable = false;
    console.error('❌ Redis Client Error:', err.message);
  });

  redisClient.on('close', () => {
    redisAvailable = false;
  });

  // Attempt connection but don't block server startup
  redisClient.connect().catch((err) => {
    redisAvailable = false;
    console.warn('⚠️  Redis connection failed:', err.message, '— server will run without Redis features.');
  });
} catch (err) {
  console.warn('⚠️  Redis initialization failed:', err.message, '— server will run without Redis features.');
}

function isRedisAvailable() {
  return redisAvailable && redisClient && redisClient.status === 'ready';
}

module.exports = redisClient;
module.exports.isRedisAvailable = isRedisAvailable;

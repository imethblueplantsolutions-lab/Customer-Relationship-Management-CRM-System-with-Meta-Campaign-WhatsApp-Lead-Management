const redisClient = require('../config/redis');
const { isRedisAvailable } = require('../config/redis');

class CacheService {
  static async get(key) {
    if (!isRedisAvailable()) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Cache get error for key ${key}:`, err.message);
      return null;
    }
  }

  static async set(key, value, ttlSeconds = 300) {
    if (!isRedisAvailable()) return;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err.message);
    }
  }

  static async invalidatePattern(pattern) {
    if (!isRedisAvailable()) return;
    try {
      const stream = redisClient.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        if (keys.length > 0) {
          const pipeline = redisClient.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      }
    } catch (err) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, err.message);
    }
  }

  static async checkAndSetLock(key, ttlSeconds = 60) {
    if (!isRedisAvailable()) return true; // Fail open to process
    try {
      const result = await redisClient.setnx(key, 'LOCKED');
      if (result === 1) {
        await redisClient.expire(key, ttlSeconds);
        return true; // Lock acquired
      }
      return false; // Already locked
    } catch (err) {
      console.error(`Lock acquisition error for key ${key}:`, err.message);
      return true; // Fail open to process
    }
  }
}

module.exports = CacheService;

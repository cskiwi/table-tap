import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis, Cluster } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { REDIS_CONNECTION_TOKEN } from '../config/redis.config';
import { CacheOptions } from '../interfaces/redis-config.interface';

export interface CacheKeyInfo {
  key: string;
  ttl: number;
  size: number;
  type: string;
}

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis | Cluster,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('REDIS_CACHE_TTL', 3600);
    this.keyPrefix = this.configService.get<string>('REDIS_CACHE_PREFIX', 'tabletap:cache:');
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options?.namespace);
      const ttl = options?.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }

      this.logger.debug(`Cached value for key: ${fullKey} with TTL: ${ttl}`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        return null;
      }

      const parsedValue = JSON.parse(value);
      this.logger.debug(`Cache hit for key: ${fullKey}`);
      return parsedValue as T;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, namespace));
      const values = await this.redis.mget(...fullKeys);

      return values.map((value, index) => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          this.logger.warn(`Failed to parse cached value for key: ${fullKeys[index]}`);
          return null;
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get multiple cache values:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redis.del(fullKey);
      this.logger.debug(`Deleted cache key: ${fullKey}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async mdel(keys: string[], namespace?: string): Promise<number> {
    try {
      if (keys.length === 0) return 0;

      const fullKeys = keys.map(key => this.buildKey(key, namespace));
      const result = await this.redis.del(...fullKeys);
      this.logger.debug(`Deleted ${result} cache keys`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete multiple cache keys:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, ttl: number, namespace?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, namespace);
      const result = await this.redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set TTL for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.incr(fullKey);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment by a specific amount
   */
  async incrby(key: string, increment: number, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.incrby(fullKey, increment);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key} by ${increment}:`, error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, namespace?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, namespace);
      return await this.redis.decr(fullKey);
    } catch (error) {
      this.logger.error(`Failed to decrement key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cache with optional pattern
   */
  async clear(pattern?: string): Promise<number> {
    try {
      const searchPattern = pattern
        ? this.buildKey(pattern, undefined)
        : `${this.keyPrefix}*`;

      const keys = await this.redis.keys(searchPattern);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);
      this.logger.log(`Cleared ${result} cache keys with pattern: ${searchPattern}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to clear cache with pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: string;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.keys(`${this.keyPrefix}*`);

      return {
        totalKeys: keys.length,
        memoryUsage: this.extractFromInfo(info, 'used_memory_human'),
        hitRate: this.extractFromInfo(info, 'keyspace_hits'),
      }
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return { totalKeys: 0, memoryUsage: '0B' }
    }
  }

  // Restaurant-specific caching methods

  /**
   * Cache menu items for a cafe
   */
  async cacheMenuItems(cafeId: string, menuItems: any[], ttl = 3600): Promise<void> {
    const key = `menu:${cafeId}`;
    await this.set(key, menuItems, { ttl, namespace: 'restaurant' });
  }

  /**
   * Get cached menu items
   */
  async getCachedMenuItems(cafeId: string): Promise<any[] | null> {
    const key = `menu:${cafeId}`;
    return this.get(key, 'restaurant');
  }

  /**
   * Cache cafe information
   */
  async cacheCafeInfo(cafeId: string, cafeInfo: any, ttl = 7200): Promise<void> {
    const key = `cafe:${cafeId}`;
    await this.set(key, cafeInfo, { ttl, namespace: 'restaurant' });
  }

  /**
   * Get cached cafe information
   */
  async getCachedCafeInfo(cafeId: string): Promise<any | null> {
    const key = `cafe:${cafeId}`;
    return this.get(key, 'restaurant');
  }

  /**
   * Cache inventory levels
   */
  async cacheInventoryLevels(cafeId: string, inventory: any[], ttl = 1800): Promise<void> {
    const key = `inventory:${cafeId}`;
    await this.set(key, inventory, { ttl, namespace: 'restaurant' });
  }

  /**
   * Get cached inventory levels
   */
  async getCachedInventoryLevels(cafeId: string): Promise<any[] | null> {
    const key = `inventory:${cafeId}`;
    return this.get(key, 'restaurant');
  }

  /**
   * Cache employee permissions
   */
  async cacheEmployeePermissions(userId: string, permissions: string[], ttl = 3600): Promise<void> {
    const key = `permissions:${userId}`;
    await this.set(key, permissions, { ttl, namespace: 'auth' });
  }

  /**
   * Get cached employee permissions
   */
  async getCachedEmployeePermissions(userId: string): Promise<string[] | null> {
    const key = `permissions:${userId}`;
    return this.get(key, 'auth');
  }

  /**
   * Invalidate cafe-related cache
   */
  async invalidateCafeCache(cafeId: string): Promise<void> {
    const patterns = [
      `menu:${cafeId}`,
      `cafe:${cafeId}`,
      `inventory:${cafeId}`,];
    await Promise.all(
      patterns.map(pattern => this.del(pattern, 'restaurant'))
    );

    this.logger.log(`Invalidated cache for cafe: ${cafeId}`);
  }

  /**
   * Invalidate user-related cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `permissions:${userId}`,
      `profile:${userId}`,];
    await Promise.all(
      patterns.map(pattern => this.del(pattern, 'auth'))
    );

    this.logger.log(`Invalidated cache for user: ${userId}`);
  }

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace ? `${namespace}:` : '';
    return `${this.keyPrefix}${ns}${key}`;
  }

  private extractFromInfo(info: string, key: string): string {
    const lines = info.split('\r\n');
    const line = lines.find(l => l.startsWith(`${key}:`));
    return line ? line.split(':')[1] : '0';
  }
}
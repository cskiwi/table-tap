import { SetMetadata, Injectable, Inject } from '@nestjs/common';
import { RedisCacheService } from '../services/cache.service';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_NAMESPACE_METADATA = 'cache:namespace';

/**
 * Decorator to cache method results
 */
export function Cacheable(key?: string, ttl?: number, namespace?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheService = this.cacheService as RedisCacheService;

      if (!cacheService) {
        console.warn('RedisCacheService not found, executing method without caching');
        return method.apply(this, args);
      }

      // Build cache key
      const cacheKey = key || `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Try to get from cache first
        const cachedResult = await cacheService.get(cacheKey, namespace);
        if (cachedResult !== null) {
          return cachedResult;
        }

        // Execute method and cache result
        const result = await method.apply(this, args);
        if (result !== undefined && result !== null) {
          await cacheService.set(cacheKey, result, { ttl, namespace });
        }

        return result;
      } catch (error) {
        console.error('Cache operation failed, executing method:', error);
        return method.apply(this, args);
      }
    }

    // Set metadata for reflection
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    SetMetadata(CACHE_NAMESPACE_METADATA, namespace)(target, propertyName, descriptor);

    return descriptor;
  }
}

/**
 * Decorator to invalidate cache after method execution
 */
export function CacheEvict(key?: string, namespace?: string, condition?: (result: any) => boolean) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await method.apply(this, args);

      const cacheService = this.cacheService as RedisCacheService;
      if (!cacheService) {
        return result;
      }

      try {
        // Check condition if provided
        if (condition && !condition(result)) {
          return result;
        }

        const cacheKey = key || `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        await cacheService.del(cacheKey, namespace);
      } catch (error) {
        console.error('Cache eviction failed:', error);
      }

      return result;
    }

    return descriptor;
  }
}

/**
 * Decorator to invalidate multiple cache patterns
 */
export function CacheEvictPattern(patterns: string[], namespace?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await method.apply(this, args);

      const cacheService = this.cacheService as RedisCacheService;
      if (!cacheService) {
        return result;
      }

      try {
        for (const pattern of patterns) {
          await cacheService.clear(pattern);
        }
      } catch (error) {
        console.error('Cache pattern eviction failed:', error);
      }

      return result;
    }

    return descriptor;
  }
}

/**
 * Decorator to cache based on user context
 */
export function CacheUserContext(keyBuilder?: (userId: string, ...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheService = this.cacheService as RedisCacheService;

      if (!cacheService) {
        return method.apply(this, args);
      }

      // Extract user ID from context (assuming it's in the first argument or context)
      const userId = this.getCurrentUserId ? this.getCurrentUserId() : args[0]?.userId;
      if (!userId) {
        return method.apply(this, args);
      }

      const cacheKey = keyBuilder
        ? keyBuilder(userId, ...args)
        : `${target.constructor.name}:${propertyName}:user:${userId}:${JSON.stringify(args.slice(1))}`;

      try {
        const cachedResult = await cacheService.get(cacheKey, 'user');
        if (cachedResult !== null) {
          return cachedResult;
        }

        const result = await method.apply(this, args);
        if (result !== undefined && result !== null) {
          await cacheService.set(cacheKey, result, { ttl, namespace: 'user' });
        }

        return result;
      } catch (error) {
        console.error('User context cache operation failed:', error);
        return method.apply(this, args);
      }
    }

    return descriptor;
  }
}

/**
 * Decorator to cache based on cafe context
 */
export function CacheCafeContext(keyBuilder?: (cafeId: string, ...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheService = this.cacheService as RedisCacheService;

      if (!cacheService) {
        return method.apply(this, args);
      }

      // Extract cafe ID from context
      const cafeId = this.getCurrentCafeId ? this.getCurrentCafeId() : args[0]?.cafeId || args[0]
      if (!cafeId) {
        return method.apply(this, args);
      }

      const cacheKey = keyBuilder
        ? keyBuilder(cafeId, ...args)
        : `${target.constructor.name}:${propertyName}:cafe:${cafeId}:${JSON.stringify(args.slice(1))}`;

      try {
        const cachedResult = await cacheService.get(cacheKey, 'restaurant');
        if (cachedResult !== null) {
          return cachedResult;
        }

        const result = await method.apply(this, args);
        if (result !== undefined && result !== null) {
          await cacheService.set(cacheKey, result, { ttl, namespace: 'restaurant' });
        }

        return result;
      } catch (error) {
        console.error('Cafe context cache operation failed:', error);
        return method.apply(this, args);
      }
    }

    return descriptor;
  }
}

/**
 * Injectable mixin to add cache service to classes
 */
export function WithCache<T extends new (...args: any[]) => {}>(constructor: T) {
  @Injectable()
  class CacheableClass extends constructor {
    public cacheService!: RedisCacheService;

    constructor(...args: any[]) {
      super(...args);
    }

    public async invalidateCache(pattern: string, namespace?: string): Promise<void> {
      try {
        await this.cacheService.clear(pattern);
      } catch (error) {
        console.error('Cache invalidation failed:', error);
      }
    }

    public async invalidateCafeCache(cafeId: string): Promise<void> {
      await this.cacheService.invalidateCafeCache(cafeId);
    }

    public async invalidateUserCache(userId: string): Promise<void> {
      await this.cacheService.invalidateUserCache(userId);
    }
  }

  return CacheableClass;
}

// Utility function to create cache key with arguments
export function createCacheKey(prefix: string, ...args: any[]): string {
  const argsString = args
    .filter(arg => arg !== undefined && arg !== null)
    .map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
    .join(':');

  return `${prefix}:${argsString}`;
}

// Common cache TTL constants
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  DAY: 86400,      // 24 hours
  WEEK: 604800,    // 7 days
} as const;
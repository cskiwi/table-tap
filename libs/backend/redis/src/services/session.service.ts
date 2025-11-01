import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cluster, Redis } from 'ioredis';
import { REDIS_CONNECTION_TOKEN } from '../config';
import { SessionData } from '../interfaces';

export interface SessionCreateOptions {
  ttl?: number;
  slidingExpiration?: boolean;
}

@Injectable()
export class RedisSessionService {
  private readonly logger = new Logger(RedisSessionService.name);
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis | Cluster,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('REDIS_SESSION_TTL', 86400); // 24 hours
    this.keyPrefix = this.configService.get<string>('REDIS_SESSION_PREFIX', 'tabletap:session:');
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string, sessionData: SessionData, options?: SessionCreateOptions): Promise<void> {
    try {
      const key = this.buildSessionKey(sessionId);
      const ttl = options?.ttl || this.defaultTTL;

      const sessionPayload = {
        ...sessionData,
        createdAt: new Date(),
        lastActivity: new Date(),
        slidingExpiration: options?.slidingExpiration || false,
      };

      await this.redis.setex(key, ttl, JSON.stringify(sessionPayload));

      // Also create a user->session mapping for quick lookups
      const userSessionKey = this.buildUserSessionKey(sessionData.userId);
      await this.redis.setex(userSessionKey, ttl, sessionId);

      this.logger.debug(`Created session ${sessionId} for user ${sessionData.userId}`);
    } catch (error) {
      this.logger.error(`Failed to create session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.buildSessionKey(sessionId);
      const sessionData = await this.redis.get(key);

      if (!sessionData) {
        return null;
      }

      const parsed = JSON.parse(sessionData) as SessionData & {
        createdAt: Date;
        slidingExpiration: boolean;
      };

      // Update last activity if sliding expiration is enabled
      if (parsed.slidingExpiration) {
        await this.updateLastActivity(sessionId);
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const existing = await this.getSession(sessionId);
      if (!existing) {
        return false;
      }

      const key = this.buildSessionKey(sessionId);
      const ttl = await this.redis.ttl(key);

      const updatedSession = {
        ...existing,
        ...updates,
        lastActivity: new Date(),
      };

      if (ttl > 0) {
        await this.redis.setex(key, ttl, JSON.stringify(updatedSession));
      } else {
        await this.redis.set(key, JSON.stringify(updatedSession));
      }

      this.logger.debug(`Updated session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(sessionId: string): Promise<boolean> {
    try {
      const existing = await this.getSession(sessionId);
      if (!existing) {
        return false;
      }

      const key = this.buildSessionKey(sessionId);
      const ttl = await this.redis.ttl(key);

      const updatedSession = {
        ...existing,
        lastActivity: new Date(),
      };

      if (ttl > 0) {
        await this.redis.setex(key, ttl, JSON.stringify(updatedSession));
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to update last activity for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, additionalSeconds: number): Promise<boolean> {
    try {
      const key = this.buildSessionKey(sessionId);
      const currentTTL = await this.redis.ttl(key);

      if (currentTTL <= 0) {
        return false;
      }

      const newTTL = currentTTL + additionalSeconds;
      const result = await this.redis.expire(key, newTTL);

      // Also update user session mapping
      const sessionData = await this.getSession(sessionId);
      if (sessionData) {
        const userSessionKey = this.buildUserSessionKey(sessionData.userId);
        await this.redis.expire(userSessionKey, newTTL);
      }

      this.logger.debug(`Extended session ${sessionId} by ${additionalSeconds} seconds`);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to extend session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      const key = this.buildSessionKey(sessionId);

      const result = await this.redis.del(key);

      // Also remove user session mapping
      if (sessionData) {
        const userSessionKey = this.buildUserSessionKey(sessionData.userId);
        await this.redis.del(userSessionKey);
      }

      this.logger.debug(`Deleted session ${sessionId}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    try {
      const userSessionKey = this.buildUserSessionKey(userId);
      const sessionId = await this.redis.get(userSessionKey);

      let deletedCount = 0;

      if (sessionId) {
        const sessionKey = this.buildSessionKey(sessionId);
        const sessionDeleted = await this.redis.del(sessionKey);
        const userSessionDeleted = await this.redis.del(userSessionKey);
        deletedCount = sessionDeleted + userSessionDeleted;
      }

      // Also search for any orphaned sessions
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            if (parsed.userId === userId) {
              await this.redis.del(key);
              deletedCount++;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      this.logger.log(`Deleted ${deletedCount} sessions for user ${userId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete sessions for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Get session by user ID
   */
  async getSessionByUserId(userId: string): Promise<{ sessionId: string; data: SessionData } | null> {
    try {
      const userSessionKey = this.buildUserSessionKey(userId);
      const sessionId = await this.redis.get(userSessionKey);

      if (!sessionId) {
        return null;
      }

      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        // Clean up orphaned user session mapping
        await this.redis.del(userSessionKey);
        return null;
      }

      return { sessionId, data: sessionData };
    } catch (error) {
      this.logger.error(`Failed to get session for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Check if session exists and is valid
   */
  async isValidSession(sessionId: string): Promise<boolean> {
    try {
      const key = this.buildSessionKey(sessionId);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check session validity ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get session TTL
   */
  async getSessionTTL(sessionId: string): Promise<number> {
    try {
      const key = this.buildSessionKey(sessionId);
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get session TTL ${sessionId}:`, error);
      return -1;
    }
  }

  /**
   * Get all active sessions (admin function)
   */
  async getActiveSessions(): Promise<Array<{ sessionId: string; data: SessionData }>> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const sessions: Array<{ sessionId: string; data: SessionData }> = [];

      for (const key of keys) {
        if (key.includes(':user:')) continue; // Skip user mapping keys

        const sessionData = await this.redis.get(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData) as SessionData;
            const sessionId = key.replace(this.keyPrefix, '');
            sessions.push({ sessionId, data: parsed });
          } catch {
            // Ignore parse errors
          }
        }
      }

      return sessions;
    } catch (error) {
      this.logger.error('Failed to get active sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions (maintenance function)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist (expired)
          cleanedCount++;
        }
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to clean up expired sessions:', error);
      return 0;
    }
  }

  // Restaurant-specific session methods

  /**
   * Set active cafe for session
   */
  async setActiveCafe(sessionId: string, cafeId: string): Promise<boolean> {
    return this.updateSession(sessionId, { cafeId });
  }

  /**
   * Get sessions for a specific cafe
   */
  async getCafeSessions(cafeId: string): Promise<Array<{ sessionId: string; data: SessionData }>> {
    try {
      const allSessions = await this.getActiveSessions();
      return allSessions.filter((session) => session.data.cafeId === cafeId);
    } catch (error) {
      this.logger.error(`Failed to get sessions for cafe ${cafeId}:`, error);
      return [];
    }
  }

  /**
   * Update user permissions in session
   */
  async updatePermissions(sessionId: string, permissions: string[]): Promise<boolean> {
    return this.updateSession(sessionId, { permissions });
  }

  private buildSessionKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }

  private buildUserSessionKey(userId: string): string {
    return `${this.keyPrefix}user:${userId}`;
  }
}

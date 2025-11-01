import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Cluster, Redis } from 'ioredis';
import { REDIS_CONNECTION_TOKEN, REDIS_PUBSUB_TOKEN } from '../config';

interface RedisHealthInfo {
  status: 'up' | 'down';
  message?: string;
  details?: {
    uptime?: number;
    connectedClients?: number;
    memoryUsage?: string;
    totalCommands?: number;
    lastPingTime?: number;
    clusterInfo?: any;
  };
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(REDIS_CONNECTION_TOKEN) private readonly redis: Redis | Cluster,
    @Inject(REDIS_PUBSUB_TOKEN) private readonly pubsubRedis: Redis | Cluster,
  ) {
    super();
  }

  /**
   * Check Redis connection health
   */
  async checkRedisConnection(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Test basic connection with PING
      const pingResult = await this.redis.ping();
      const pingTime = Date.now() - startTime;

      if (pingResult !== 'PONG') {
        throw new Error(`Unexpected ping response: ${pingResult}`);
      }

      // Get Redis info
      const info = await this.redis.info();
      const details = this.parseRedisInfo(info);
      details.lastPingTime = pingTime;

      // Check if it's a cluster
      if (this.redis instanceof Cluster) {
        details.clusterInfo = await this.getClusterInfo();
      }

      const healthInfo: RedisHealthInfo = {
        status: 'up',
        details,
      };

      return this.getStatus(key, true, healthInfo);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const healthInfo: RedisHealthInfo = {
        status: 'down',
        message: errorMessage,
      };

      throw new HealthCheckError(`Redis health check failed: ${errorMessage}`, this.getStatus(key, false, healthInfo));
    }
  }

  /**
   * Check Redis PubSub health
   */
  async checkPubSubConnection(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Test PubSub connection
      const pingResult = await this.pubsubRedis.ping();
      const pingTime = Date.now() - startTime;

      if (pingResult !== 'PONG') {
        throw new Error(`Unexpected pubsub ping response: ${pingResult}`);
      }

      const healthInfo: RedisHealthInfo = {
        status: 'up',
        details: {
          lastPingTime: pingTime,
        },
      };

      return this.getStatus(key, true, healthInfo);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const healthInfo: RedisHealthInfo = {
        status: 'down',
        message: errorMessage,
      };

      throw new HealthCheckError(`Redis PubSub health check failed: ${errorMessage}`, this.getStatus(key, false, healthInfo));
    }
  }

  /**
   * Comprehensive Redis health check
   */
  async checkRedisHealth(key = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const [connectionResult, pubsubResult] = await Promise.allSettled([
        this.checkRedisConnection('connection'),
        this.checkPubSubConnection('pubsub'),
      ]);

      const isHealthy = connectionResult.status === 'fulfilled' && pubsubResult.status === 'fulfilled';

      const details = {
        connection:
          connectionResult.status === 'fulfilled'
            ? connectionResult.value[Object.keys(connectionResult.value)[0]]
            : { status: 'down', message: connectionResult.reason?.message },
        pubsub:
          pubsubResult.status === 'fulfilled'
            ? pubsubResult.value[Object.keys(pubsubResult.value)[0]]
            : { status: 'down', message: pubsubResult.reason?.message },
      };

      if (!isHealthy) {
        throw new HealthCheckError('Redis components health check failed', this.getStatus(key, false, details));
      }

      return this.getStatus(key, true, details);
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(`Redis comprehensive health check failed: ${errorMessage}`, this.getStatus(key, false, { message: errorMessage }));
    }
  }

  /**
   * Check Redis memory usage
   */
  async checkMemoryUsage(key: string, maxMemoryMB = 1000): Promise<HealthIndicatorResult> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsedBytes = this.extractInfoValue(info, 'used_memory');
      const memoryUsedMB = Math.round(memoryUsedBytes / 1024 / 1024);

      const isHealthy = memoryUsedMB <= maxMemoryMB;
      const healthInfo = {
        status: isHealthy ? ('up' as const) : ('down' as const),
        details: {
          memoryUsedMB,
          maxMemoryMB,
          memoryUsage: `${memoryUsedMB}MB / ${maxMemoryMB}MB`,
        },
      };

      if (!isHealthy) {
        throw new HealthCheckError(
          `Redis memory usage exceeded threshold: ${memoryUsedMB}MB > ${maxMemoryMB}MB`,
          this.getStatus(key, false, healthInfo),
        );
      }

      return this.getStatus(key, true, healthInfo);
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(`Redis memory check failed: ${errorMessage}`, this.getStatus(key, false, { status: 'down', message: errorMessage }));
    }
  }

  /**
   * Check Redis performance metrics
   */
  async checkPerformance(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Perform a simple SET/GET test
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'health_check_value';

      await this.redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
      const retrievedValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      const operationTime = Date.now() - startTime;

      if (retrievedValue !== testValue) {
        throw new Error('Set/Get operation failed');
      }

      const isHealthy = operationTime < 100; // Less than 100ms
      const healthInfo = {
        status: isHealthy ? ('up' as const) : ('down' as const),
        details: {
          operationTime,
          threshold: 100,
        },
      };

      if (!isHealthy) {
        throw new HealthCheckError(`Redis performance degraded: ${operationTime}ms > 100ms`, this.getStatus(key, false, healthInfo));
      }

      return this.getStatus(key, true, healthInfo);
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(
        `Redis performance check failed: ${errorMessage}`,
        this.getStatus(key, false, { status: 'down', message: errorMessage }),
      );
    }
  }

  private parseRedisInfo(info: string): any {
    const details: any = {};

    details.uptime = this.extractInfoValue(info, 'uptime_in_seconds');
    details.connectedClients = this.extractInfoValue(info, 'connected_clients');
    details.memoryUsage = this.extractInfoValueString(info, 'used_memory_human');
    details.totalCommands = this.extractInfoValue(info, 'total_commands_processed');

    return details;
  }

  private async getClusterInfo(): Promise<any> {
    try {
      if (this.redis instanceof Cluster) {
        const clusterNodes = this.redis.nodes();
        return {
          nodeCount: clusterNodes.length,
          status: await (this.redis as Cluster).call('cluster', 'info'),
        };
      }
      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  }

  private extractInfoValue(info: string, key: string): number {
    const lines = info.split('\r\n');
    const line = lines.find((l) => l.startsWith(`${key}:`));
    return line ? parseInt(line.split(':')[1], 10) : 0;
  }

  private extractInfoValueString(info: string, key: string): string {
    const lines = info.split('\r\n');
    const line = lines.find((l) => l.startsWith(`${key}:`));
    return line ? line.split(':')[1] : '0';
  }
}

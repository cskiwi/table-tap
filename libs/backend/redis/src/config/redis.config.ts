import { ConfigService } from '@nestjs/config';
import { RedisModuleOptions } from '../interfaces/redis-config.interface';

export const redisConfigFactory = (configService: ConfigService): RedisModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const redisUrl = configService.get<string>('REDIS_URL');
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  const redisDb = configService.get<number>('REDIS_DB', 0);

  // Cluster configuration
  const clusterEnabled = configService.get<boolean>('REDIS_CLUSTER_ENABLED', false);
  const clusterNodes = configService.get<string>('REDIS_CLUSTER_NODES', '');

  // Parse cluster nodes if provided
  const parsedClusterNodes = clusterNodes
    ? clusterNodes.split(',').map(node => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port, 10) }
      })
    : []

  const baseConfig = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    db: redisDb,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Connection pool settings
    family: 4,
    // Retry configuration
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // Reconnect configuration
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      return err.message.includes(targetError);
    },
  }

  // Use Redis URL if provided, otherwise use individual config
  if (redisUrl) {
    const url = new URL(redisUrl);
    baseConfig.host = url.hostname;
    baseConfig.port = parseInt(url.port, 10) || 6379;
    baseConfig.password = url.password || undefined;
    baseConfig.db = parseInt(url.pathname.slice(1), 10) || 0;
  }

  return {
    redis: baseConfig,
    cluster: clusterEnabled ? {
      enabled: true,
      nodes: parsedClusterNodes.length > 0 ? parsedClusterNodes : [
        { host: redisHost, port: redisPort }
      ],
      options: {
        redisOptions: {
          password: redisPassword,
          connectTimeout: 10000,
          commandTimeout: 5000,
          lazyConnect: true,
        },
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        slotsRefreshTimeout: 10000,
        slotsRefreshInterval: 5000,
      }
    } : undefined,
    pubsub: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: undefined, // No limit for pubsub
      lazyConnect: true,
    },
    cache: {
      defaultTTL: configService.get<number>('REDIS_CACHE_TTL', 3600), // 1 hour
      maxMemoryPolicy: configService.get<string>('REDIS_MAX_MEMORY_POLICY', 'allkeys-lru'),
      keyPrefix: configService.get<string>('REDIS_CACHE_PREFIX', 'tabletap:cache:'),
    },
    session: {
      ttl: configService.get<number>('REDIS_SESSION_TTL', 86400), // 24 hours
      keyPrefix: configService.get<string>('REDIS_SESSION_PREFIX', 'tabletap:session:'),
    }
  }
}

export const REDIS_CONNECTION_TOKEN = 'REDIS_CONNECTION';
export const REDIS_CLUSTER_TOKEN = 'REDIS_CLUSTER';
export const REDIS_PUBSUB_TOKEN = 'REDIS_PUBSUB';
export const REDIS_SUBSCRIBER_TOKEN = 'REDIS_SUBSCRIBER';
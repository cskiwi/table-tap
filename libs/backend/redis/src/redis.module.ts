import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';
import { RedisModuleOptions } from './interfaces/redis-config.interface';
import { redisConfigFactory, REDIS_CONNECTION_TOKEN, REDIS_CLUSTER_TOKEN, REDIS_PUBSUB_TOKEN, REDIS_SUBSCRIBER_TOKEN } from './config/redis.config';
import { RedisPubSubService } from './services/pubsub.service';
import { RedisCacheService } from './services/cache.service';
import { RedisSessionService } from './services/session.service';
import { RedisHealthIndicator } from './health/redis.health';

@Global()
@Module({})
export class RedisModule {
  static forRoot(options?: Partial<RedisModuleOptions>): DynamicModule {
    const redisProviders = this.createRedisProviders(options);

    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        ...redisProviders,
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
        RedisHealthIndicator,
      ],
      exports: [
        REDIS_CONNECTION_TOKEN,
        REDIS_CLUSTER_TOKEN,
        REDIS_PUBSUB_TOKEN,
        REDIS_SUBSCRIBER_TOKEN,
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
        RedisHealthIndicator,
      ],
    }
  }

  static forRootAsync(options: {
    imports?: any[]
    useFactory?: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
    inject?: any[]
  }): DynamicModule {
    const redisProviders = this.createAsyncRedisProviders(options);

    return {
      module: RedisModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers: [
        ...redisProviders,
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
        RedisHealthIndicator,
      ],
      exports: [
        REDIS_CONNECTION_TOKEN,
        REDIS_CLUSTER_TOKEN,
        REDIS_PUBSUB_TOKEN,
        REDIS_SUBSCRIBER_TOKEN,
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
        RedisHealthIndicator,
      ],
    }
  }

  private static createRedisProviders(options?: Partial<RedisModuleOptions>): Provider[] {
    return [
      {
        provide: 'REDIS_MODULE_OPTIONS',
        useFactory: (configService: ConfigService) => {
          const defaultConfig = redisConfigFactory(configService);
          return { ...defaultConfig, ...options }
        },
        inject: [ConfigService],
      },
      {
        provide: REDIS_CONNECTION_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, config.cluster.options);
          }
          return new Redis(config.redis);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },
      {
        provide: REDIS_PUBSUB_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          const pubsubConfig = { ...config.redis, ...config.pubsub }
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, {
              ...config.cluster.options,
              redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub }
            });
          }
          return new Redis(pubsubConfig);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },
      {
        provide: REDIS_SUBSCRIBER_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          const subscriberConfig = { ...config.redis, ...config.pubsub }
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, {
              ...config.cluster.options,
              redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub }
            });
          }
          return new Redis(subscriberConfig);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },]
  }

  private static createAsyncRedisProviders(options: {
    useFactory?: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;
    inject?: any[]
  }): Provider[] {
    return [
      {
        provide: 'REDIS_MODULE_OPTIONS',
        useFactory: options.useFactory!,
        inject: options.inject || [],
      },
      {
        provide: REDIS_CONNECTION_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, config.cluster.options);
          }
          return new Redis(config.redis);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },
      {
        provide: REDIS_PUBSUB_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          const pubsubConfig = { ...config.redis, ...config.pubsub }
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, {
              ...config.cluster.options,
              redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub }
            });
          }
          return new Redis(pubsubConfig);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },
      {
        provide: REDIS_SUBSCRIBER_TOKEN,
        useFactory: (config: RedisModuleOptions) => {
          const subscriberConfig = { ...config.redis, ...config.pubsub }
          if (config.cluster?.enabled) {
            return new Cluster(config.cluster.nodes, {
              ...config.cluster.options,
              redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub }
            });
          }
          return new Redis(subscriberConfig);
        },
        inject: ['REDIS_MODULE_OPTIONS'],
      },]
  }

  static forFeature(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
      ],
      exports: [
        RedisPubSubService,
        RedisCacheService,
        RedisSessionService,
      ],
    }
  }
}
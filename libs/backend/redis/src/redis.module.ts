import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';
import { REDIS_CONNECTION_TOKEN, REDIS_PUBSUB_TOKEN, REDIS_SUBSCRIBER_TOKEN, redisConfigFactory } from './config';
import { RedisHealthIndicator } from './health';
import { RedisModuleOptions } from './interfaces';
import { RedisCacheService, RedisPubSubService, RedisSessionService } from './services';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_MODULE_OPTIONS',
      useFactory: (configService: ConfigService) => {
        return redisConfigFactory(configService);
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
        const pubsubConfig = { ...config.redis, ...config.pubsub };
        if (config.cluster?.enabled) {
          return new Cluster(config.cluster.nodes, {
            ...config.cluster.options,
            redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub },
          });
        }
        return new Redis(pubsubConfig);
      },
      inject: ['REDIS_MODULE_OPTIONS'],
    },
    {
      provide: REDIS_SUBSCRIBER_TOKEN,
      useFactory: (config: RedisModuleOptions) => {
        const subscriberConfig = { ...config.redis, ...config.pubsub };
        if (config.cluster?.enabled) {
          return new Cluster(config.cluster.nodes, {
            ...config.cluster.options,
            redisOptions: { ...config.cluster.options.redisOptions, ...config.pubsub },
          });
        }
        return new Redis(subscriberConfig);
      },
      inject: ['REDIS_MODULE_OPTIONS'],
    },
    RedisPubSubService,
    RedisCacheService,
    RedisSessionService,
    RedisHealthIndicator,
  ],
  exports: [
    REDIS_CONNECTION_TOKEN,
    REDIS_PUBSUB_TOKEN,
    REDIS_SUBSCRIBER_TOKEN,
    RedisPubSubService,
    RedisCacheService,
    RedisSessionService,
    RedisHealthIndicator,
  ],
})
export class RedisModule {}

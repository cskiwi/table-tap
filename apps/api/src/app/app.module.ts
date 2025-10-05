import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@app/backend-graphql';
import { DatabaseModule } from '@app/backend-database';
import { HealthModule } from '@app/backend-health';
import { RedisModule } from '@app/backend-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database configuration
    DatabaseModule,

    // Redis infrastructure
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        cluster: {
          enabled: configService.get('REDIS_CLUSTER_ENABLED', false),
          nodes: configService.get('REDIS_CLUSTER_NODES', '')
            .split(',')
            .filter(Boolean)
            .map(node => {
              const [host, port] = node.split(':');
              return { host, port: parseInt(port, 10) }
            }),
        },
        cache: {
          defaultTTL: configService.get('REDIS_CACHE_TTL', 3600),
          keyPrefix: configService.get('REDIS_CACHE_PREFIX', 'tabletap:cache:'),
        },
        session: {
          ttl: configService.get('REDIS_SESSION_TTL', 86400),
          keyPrefix: configService.get('REDIS_SESSION_PREFIX', 'tabletap:session:'),
        },
      }),
      inject: [ConfigService],
    }),

    // GraphQL configuration (includes Redis subscriptions)
    GraphQLModule,

    // Health checks
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
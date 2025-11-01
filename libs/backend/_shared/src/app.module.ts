import { AuthorizationModule } from '@app/backend-authorization';
import { DatabaseModule } from '@app/backend-database';
import { GraphQLModule } from '@app/backend-graphql';
import { HealthModule } from '@app/backend-health';
import { SeoModule } from '@app/backend-seo';
import { TranslateModule } from '@app/backend-translate';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@app/backend-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
    }),
    DatabaseModule,
    AuthorizationModule,
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
          nodes: configService
            .get('REDIS_CLUSTER_NODES', '')
            .split(',')
            .filter(Boolean)
            .map((node: string) => {
              const [host, port] = node.split(':');
              return { host, port: parseInt(port, 10) };
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

    GraphQLModule,
    SeoModule,
    HealthModule,
    TranslateModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
})
export class AppModule {}

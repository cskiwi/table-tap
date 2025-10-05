import { AuthorizationModule } from '@app/backend-authorization';
import { DatabaseModule } from '@app/backend-database';
// import { GraphQLModule } from '@app/backend-graphql'; // Import directly in main app
import { HealthModule } from '@app/backend-health';
import { SeoModule } from '@app/backend-seo';
import { TranslateModule } from '@app/backend-translate';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
    }),
    DatabaseModule,
    AuthorizationModule,
    // GraphQLModule, // Import directly in main app
    SeoModule,
    HealthModule,
    TranslateModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeDataSource } from './orm.config';


@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { config } = initializeDataSource(configService);

        return config;
      },
    }),
  ],
})
export class DatabaseModule {}

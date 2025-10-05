import {
  // Core entities
  User,
  Cafe,
  Configuration,

  // Order management
  Product,
  Order,
  OrderItem,
  Payment,

  // Operations
  Counter,
  Employee,
  TimeSheet,
  TimeEntry,

  // Stock
  Stock,
  StockMovement,
  Purchase,
  PurchaseItem,

  // Glass management
  Glass,
  GlassMovement,

  // Customer management
  Credit,

  // Loyalty system
  LoyaltyAccount,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyChallenge,
  LoyaltyPromotion
} from '@app/models';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const entities = [
  // Core entities (no dependencies)
  Cafe,
  User,
  Configuration,

  // Order management
  Product,
  Counter,
  Order,
  OrderItem,
  Payment,

  // Operations (depends on User, Cafe)
  Employee,
  TimeSheet,
  TimeEntry,

  // Stock (depends on Product, Cafe)
  Stock,
  StockMovement,
  Purchase,
  PurchaseItem,

  // Glass management (depends on Cafe, User, Order)
  Glass,
  GlassMovement,

  // Customer management (depends on User, Cafe)
  Credit,

  // Loyalty system (depends on User, Cafe)
  LoyaltyTier,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  LoyaltyRewardRedemption,
  LoyaltyChallenge,
  LoyaltyPromotion
];
export function getDbConfig(configService?: ConfigService): DataSourceOptions {
  const getEnvVar = (key: string, defaultValue?: string) => (configService ? configService.get<string>(key) : process.env[key] || defaultValue);

  const addMigrations = getEnvVar('RUN_MIGRATIONS')?.trim() === 'true';
  const dbType = getEnvVar('DB_TYPE')?.trim()
  let config: DataSourceOptions;

  console.log('DB_TYPE:', dbType);
  console.log('RUN_MIGRATIONS:', addMigrations);

  if (dbType === 'sqlite') {
    config = {
      type: 'sqlite',
      database: getEnvVar('DB_DATABASE'),
      synchronize: getEnvVar('DB_SYNCHRONIZE') === 'true',
    } as DataSourceOptions;
  } else if (dbType === 'postgres') {
    config = {
      type: 'postgres',
      host: getEnvVar('DB_IP'),
      port: getEnvVar('DB_PORT') ? parseInt(getEnvVar('DB_PORT') as string) : 5432,
      username: getEnvVar('DB_USER'),
      password: getEnvVar('DB_PASSWORD'),
      database: getEnvVar('DB_DATABASE'),
      ssl: getEnvVar('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      migrationsTableName: 'typeorm_migrations',
      applicationName: 'Table Tap',
      options: { trustServerCertificate: true },
      migrations: addMigrations ? ['libs/backend/database/src/migrations/*.ts'] : undefined,
      synchronize: false,
      migrationsRun: false,
      cli: {
        migrationsDir: 'libs/backend/database/src/migrations'
      },
      // logging: true,
    } as DataSourceOptions;
  } else {
    throw new Error('Unsupported DB_TYPE. Please specify either "sqlite" or "postgres".');
  }

  return config;
}

export function initializeDataSource(configService?: ConfigService) {
  const config = getDbConfig(configService);

  console.log('ORM Config:', config);

  const datasource = new DataSource({
    ...config,
    entities,
  });
  datasource.initialize()

  return {
    datasource,
    config,
  }
}
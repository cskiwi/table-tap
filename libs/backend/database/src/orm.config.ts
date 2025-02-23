import { Player } from '@app/models';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

const entities = [Player];

export function getDbConfig(configService?: ConfigService): DataSourceOptions {
  const getEnvVar = (key: string, defaultValue?: string) => (configService ? configService.get<string>(key) : process.env[key] || defaultValue);

  const addMigrations = getEnvVar('RUN_MIGRATIONS')?.trim() === 'true';
  const dbType = getEnvVar('DB_TYPE')?.trim();
  let config: DataSourceOptions;

  console.log('DB_TYPE:', dbType);
  console.log('RUN_MIGRATIONS:', addMigrations);

  if (dbType === 'sqlite') {
    config = {
      type: 'sqlite',
      database: getEnvVar('DB_DATABASE'),
      synchronize: getEnvVar('DB_SYNCHRONIZE') === 'true',
    } as SqliteConnectionOptions;
  } else if (dbType === 'postgres') {
    config = {
      type: 'postgres',
      host: getEnvVar('DB_IP'),
      port: getEnvVar('DB_PORT') ? parseInt(getEnvVar('DB_PORT')!) : 5432,
      username: getEnvVar('DB_USER'),
      password: getEnvVar('DB_PASSWORD'),
      database: getEnvVar('DB_DATABASE'),
      ssl: getEnvVar('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      migrationsTableName: 'typeorm_migrations',
      applicationName: 'Table Tab',
      options: { trustServerCertificate: true },
      migrations: addMigrations ? ['libs/backend/database/src/migrations/*.ts'] : undefined,
      synchronize: false,
      migrationsRun: false,
      // logging: true,
    } as PostgresConnectionOptions;
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
  datasource.initialize();

  return {
    datasource,
    config,
  };
}

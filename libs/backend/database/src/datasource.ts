import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnvConfig } from 'dotenv';
import { initializeDataSource } from './orm.config';

const envPath = process.env['ENV_PATH'] ? resolve(process.cwd(), process.env['ENV_PATH'] as string) : resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
	loadEnvConfig({ path: envPath });
}

export default initializeDataSource().datasource;

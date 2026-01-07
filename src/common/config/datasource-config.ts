import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'node:path';
import * as process from 'node:process';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: path.join(process.cwd(), '.env') });

// Define valid environments as a union type
type ValidEnvironment = 'development' |'production';

const appEnv =  'production';

const envMap: Record<ValidEnvironment, {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}> = {
  development: {
    host: process.env.DATABASE_HOST_DEVELOPMENT || 'localhost',
    port: parseInt(process.env.DATABASE_PORT_DEVELOPMENT || '5432', 10),
    username: process.env.DATABASE_USERNAME_DEVELOPMENT || 'postgres',
    password: process.env.DATABASE_PASSWORD_DEVELOPMENT || 'password',
    database: process.env.DATABASE_NAME_DEVELOPMENT || 'myapp_dev',
  },
  production: {
    host: process.env.DATABASE_HOST_PRODUCTION || 'localhost',
    port: parseInt(process.env.DATABASE_PORT_PRODUCTION || '5432', 10),
    username: process.env.DATABASE_USERNAME_PRODUCTION || 'postgres',
    password: process.env.DATABASE_PASSWORD_PRODUCTION || 'password',
    database: process.env.DATABASE_NAME_PRODUCTION || 'myapp_prod',
  },
};

// Validate environment
if (!appEnv || !envMap[appEnv]) {
  console.error(
    `Invalid APP_ENV environment variable: "${appEnv}". Expected "development" or "production".`
  );
  process.exit(1);
}

// Get current environment config
const currentEnvConfig = envMap[appEnv];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  synchronize: true, // Only sync in development
  // logging: appEnv === 'development',
  migrations: ['dist/migrations/*{.ts,.js}'],
  entities: ['dist/**/*.entity.js'],
  ...currentEnvConfig,
};

const datasourceConfig = new DataSource(dataSourceOptions);
export default datasourceConfig;
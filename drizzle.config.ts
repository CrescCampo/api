import { defineConfig } from 'drizzle-kit';
import { config as dotenvConfig } from 'dotenv';
import config from './src/infra/config';
import validateEnv from './src/infra/env/env.validation';

dotenvConfig();
validateEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    password: config.drizzle.postgresPass,
    port: config.drizzle.postgresPort,
    host: config.drizzle.postgresHost,
    user: config.drizzle.postgresUser,
    database: config.drizzle.postgresDbName,
  },
  schema: 'src/infra/database/models/*',
  out: 'src/infra/database/migrations',
  casing: 'snake_case',
});

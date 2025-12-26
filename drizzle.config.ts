import { defineConfig } from 'drizzle-kit';
import { config as dotenvConfig } from 'dotenv';
import { config as appConfig } from './src/infra/config';
import validateEnv from './src/infra/env/env.validation';

dotenvConfig();
validateEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    password: appConfig.drizzle.postgresPass,
    port: appConfig.drizzle.postgresPort,
    host: appConfig.drizzle.postgresHost,
    user: appConfig.drizzle.postgresUser,
    database: appConfig.drizzle.postgresDbName,
  },
  schema: 'src/infra/database/models/*',
  out: 'src/infra/database/migrations',
  casing: 'snake_case',
});

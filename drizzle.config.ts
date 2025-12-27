import { defineConfig } from 'drizzle-kit';
import Environment from 'infra/config/Environment';
import config from './src/infra/config';

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    password: config.drizzle.postgresPass,
    port: config.drizzle.postgresPort,
    host: config.drizzle.postgresHost,
    user: config.drizzle.postgresUser,
    database: config.drizzle.postgresDbName,
    ssl:
      config.app.environment !== Environment.PROD
        ? false
        : { rejectUnauthorized: false },
  },
  schema: 'src/infra/database/drizzle/models/*',
  out: 'src/infra/database/migrations',
  casing: 'snake_case',
});

import { EnvVariables } from 'infra/env/env.validation';
import { Config } from './interface';

const envVars = new EnvVariables();

const config: Config = {
  app: {
    environment: envVars.APP_ENV,
  },
  drizzle: {
    postgresUser: envVars.POSTGRES_USER,
    postgresPass: envVars.POSTGRES_PASS,
    postgresDbName: envVars.POSTGRES_DB_NAME,
    postgresHost: envVars.POSTGRES_HOST,
    postgresPort: envVars.POSTGRES_PORT,
  },
  swagger: {
    title: 'CrescCampo API',
    version: '1.0',
    path: '/docs',
    description: 'CrescCampo API',
  },
};

export default config;

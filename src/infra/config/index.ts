import { envVars } from 'infra/env/env.validation';
import { Config } from './interface';

const config: Config = {
  app: {
    port: envVars.PORT,
    environment: envVars.APP_ENV,
    rateLimit: {
      ttl: 5,
      limit: 5,
    },
  },
  jwt: {
    privateKeyBase64: envVars.JWT_PRIVATE_KEY_BASE_64,
    publicKeyBase64: envVars.JWT_PUBLIC_KEY_BASE_64,
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

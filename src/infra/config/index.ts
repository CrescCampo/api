import { envVars } from 'infra/env/env.validation';
import { Config } from './interface';

const config: Config = {
  app: {
    port: envVars.PORT,
    environment: envVars.APP_ENV,
    rateLimit: {
      ttl: envVars.RATE_LIMIT_TTL,
      limit: envVars.RATE_LIMIT_LIMIT,
    },
  },
  jwt: {
    privateKeyBase64: envVars.JWT_PRIVATE_KEY_BASE_64,
    publicKeyBase64: envVars.JWT_PUBLIC_KEY_BASE_64,
    expiresIn: Number(envVars.JWT_EXPIRES_IN),
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
  whatsapp: {
    apiUrl: envVars.WHATSAPP_API_URL,
    apiKey: envVars.WHATSAPP_API_KEY,
  },
  openai: {
    apiKey: envVars.OPENAI_API_KEY,
  },
  resend: {
    apiKey: envVars.RESEND_API_KEY,
  },
  resetPassword: {
    passwordResetUrl: (token: string) =>
      `https://cresccampo.com.br/redefinir-senha?token=${token}`,
    passwordResetTokenTtlInMinutes: 30,
    resendTemplateAlias: 'reset-password',
  },
};

export default config;

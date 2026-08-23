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
  aws: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    s3Bucket: envVars.AWS_S3_BUCKET,
  },
  resend: {
    apiKey: envVars.RESEND_API_KEY,
  },
  admin: {
    apiKey: envVars.ADMIN_API_KEY,
  },
  discord: {
    accountCreatedWebhookUrl: envVars.DISCORD_ACCOUNT_CREATED_WEBHOOK_URL ?? '',
  },
  google: {
    clientIds: (envVars.GOOGLE_CLIENT_IDS ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean),
  },
  resetPassword: {
    passwordResetUrl: (token: string) =>
      `https://cresccampo.com.br/redefinir-senha?token=${token}`,
    resendTemplateAlias: 'reset-password',
  },
  verifyEmail: {
    resendTemplateAlias: 'verify-email',
    codeSecret: envVars.VERIFICATION_CODE_SECRET,
  },
  otel: {
    enabled: envVars.OTEL_ENABLED,
  },
};

export default config;

import Environment from './Environment';

export interface Config {
  app: {
    port: number;
    environment: Environment;
    rateLimit: {
      ttl: number;
      limit: number;
    };
  };
  jwt: {
    privateKeyBase64: string;
    publicKeyBase64: string;
    expiresIn: number;
  };
  drizzle: {
    postgresUser: string;
    postgresPass: string;
    postgresDbName: string;
    postgresHost: string;
    postgresPort: number;
  };
  swagger: {
    title: string;
    description: string;
    version: string;
    path: string;
  };
  whatsapp: {
    apiUrl: string;
    apiKey: string;
  };
  openai: {
    apiKey: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
  };
  resend: {
    apiKey: string;
  };
  resetPassword: {
    passwordResetUrl: (token: string) => string;
    resendTemplateAlias: string;
  };
}

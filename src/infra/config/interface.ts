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
    expiresIn: string;
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
}

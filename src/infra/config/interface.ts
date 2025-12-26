import Environment from './Environment';

export interface Config {
  app: {
    environment: Environment;
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
}

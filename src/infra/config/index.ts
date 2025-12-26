import { EnvVariables } from 'infra/env/env.validation';

export interface Config {
  drizzle: {
    postgresUser: string;
    postgresPass: string;
    postgresDbName: string;
    postgresHost: string;
    postgresPort: number;
  };
}

export const config: Config = {
  drizzle: {
    postgresUser: EnvVariables.POSTGRES_USER,
    postgresPass: EnvVariables.POSTGRES_PASS,
    postgresDbName: EnvVariables.POSTGRES_DB_NAME,
    postgresHost: EnvVariables.POSTGRES_HOST,
    postgresPort: EnvVariables.POSTGRES_PORT,
  },
};

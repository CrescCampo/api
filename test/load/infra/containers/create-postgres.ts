import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { StartedNetwork } from 'testcontainers';

export const POSTGRES_CREDENTIALS = {
  user: 'loadtest',
  password: 'loadtest',
  database: 'loadtest',
};

export async function createPostgres(
  network: StartedNetwork,
): Promise<StartedPostgreSqlContainer> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withNetwork(network)
    .withNetworkAliases('postgres')
    .withResourcesQuota({ memory: 0.25, cpu: 0.5 })
    .withDatabase(POSTGRES_CREDENTIALS.database)
    .withUsername(POSTGRES_CREDENTIALS.user)
    .withPassword(POSTGRES_CREDENTIALS.password)
    .withExposedPorts(5432)
    .start();

  return container;
}

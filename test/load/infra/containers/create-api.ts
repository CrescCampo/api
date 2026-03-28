import { execSync } from 'node:child_process';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import type { StartedNetwork } from 'testcontainers';
import { POSTGRES_CREDENTIALS } from './create-postgres';

export type Scenario = 'single' | 'balanced';

const IMAGE_NAME = 'cresccampo-api-load';

interface CreateApiOptions {
  network: StartedNetwork;
  scenario: Scenario;
  replicas: number;
  jwtKeys: {
    privateKeyBase64: string;
    publicKeyBase64: string;
  };
}

function buildApiImage() {
  console.log('Building API image from Dockerfile (target: runner)...');
  execSync(`docker build --target runner -t ${IMAGE_NAME} .`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

export async function createApiContainers(
  options: CreateApiOptions,
): Promise<StartedTestContainer[]> {
  const { network, scenario, replicas, jwtKeys } = options;

  buildApiImage();

  const envVars = {
    PORT: '3000',
    APP_ENV: 'test',
    POSTGRES_USER: POSTGRES_CREDENTIALS.user,
    POSTGRES_PASS: POSTGRES_CREDENTIALS.password,
    POSTGRES_DB_NAME: POSTGRES_CREDENTIALS.database,
    POSTGRES_HOST: 'postgres',
    POSTGRES_PORT: '5432',
    JWT_PRIVATE_KEY_BASE_64: jwtKeys.privateKeyBase64,
    JWT_PUBLIC_KEY_BASE_64: jwtKeys.publicKeyBase64,
    WHATSAPP_API_URL: 'http://localhost:9999',
    WHATSAPP_API_KEY: 'dummy',
    RATE_LIMIT_TTL: '60000',
    RATE_LIMIT_LIMIT: '100000',
  };

  const aliases =
    scenario === 'single'
      ? ['api']
      : Array.from({ length: replicas }, (_, i) => `api-${i + 1}`);

  const containers: StartedTestContainer[] = [];

  for (const alias of aliases) {
    console.log(`Starting API container "${alias}"...`);
    const container = await new GenericContainer(IMAGE_NAME)
      .withNetwork(network)
      .withNetworkAliases(alias)
      .withResourcesQuota({ memory: 0.25, cpu: 0.5 })
      .withExposedPorts(3000)
      .withEnvironment(envVars)
      .withWaitStrategy(
        Wait.forLogMessage('Nest application successfully started'),
      )
      .start();

    containers.push(container);
  }

  return containers;
}

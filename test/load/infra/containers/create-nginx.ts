import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import type { StartedNetwork } from 'testcontainers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Scenario } from './create-api';

export async function createNginx(
  network: StartedNetwork,
  scenario: Scenario,
): Promise<StartedTestContainer> {
  const configFile = scenario === 'single' ? 'single.conf' : 'balanced.conf';
  const configPath = resolve(process.cwd(), 'test', 'load', 'infra', 'nginx', configFile);
  const configContent = readFileSync(configPath, 'utf-8');

  console.log(`Starting Nginx container (${scenario} mode)...`);
  const container = await new GenericContainer('nginx:alpine')
    .withNetwork(network)
    .withNetworkAliases('nginx')
    .withResourcesQuota({ memory: 0.25, cpu: 0.5 })
    .withCopyContentToContainer([
      {
        content: configContent,
        target: '/etc/nginx/conf.d/default.conf',
      },
    ])
    .withExposedPorts(80)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  return container;
}

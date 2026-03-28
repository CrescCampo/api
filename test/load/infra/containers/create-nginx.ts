import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import type { StartedNetwork } from 'testcontainers';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Scenario } from './create-api';

function generateBalancedConfig(replicas: number): string {
  const servers = Array.from(
    { length: replicas },
    (_, i) => `    server api-${i + 1}:3000;`,
  ).join('\n');

  return `upstream backend {
${servers}
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
}

export async function createNginx(
  network: StartedNetwork,
  scenario: Scenario,
  replicas: number,
): Promise<StartedTestContainer> {
  let configContent: string;

  if (scenario === 'single') {
    const configPath = resolve(process.cwd(), 'test', 'load', 'infra', 'nginx', 'single.conf');
    configContent = readFileSync(configPath, 'utf-8');
  } else {
    configContent = generateBalancedConfig(replicas);
  }

  console.log(`Starting Nginx container (${scenario} mode, ${scenario === 'single' ? 1 : replicas} upstream(s))...`);
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

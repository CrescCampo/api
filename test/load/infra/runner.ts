import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import type { StartedTestContainer, StartedNetwork } from 'testcontainers';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createNetwork } from './containers/create-network';
import { createPostgres, POSTGRES_CREDENTIALS } from './containers/create-postgres';
import { runMigrations } from './containers/run-migrations';
import { createApiContainers, type Scenario } from './containers/create-api';
import { createNginx } from './containers/create-nginx';
import { spawnK6 } from './helpers/spawn-k6';

function loadJwtKeys(): { privateKeyBase64: string; publicKeyBase64: string } {
  const envPath = resolve(process.cwd(), '.env.test');
  const parsed = config({ path: envPath, override: false });

  const privateKeyBase64 = parsed.parsed?.JWT_PRIVATE_KEY_BASE_64;
  const publicKeyBase64 = parsed.parsed?.JWT_PUBLIC_KEY_BASE_64;

  if (!privateKeyBase64 || !publicKeyBase64) {
    throw new Error('JWT keys not found in .env.test');
  }

  return { privateKeyBase64, publicKeyBase64 };
}

function parseArgs(): { scenario: Scenario; script: string } {
  const args = process.argv.slice(2);
  let scenario: Scenario = 'single';
  let script = 'transactions';

  for (const arg of args) {
    if (arg.startsWith('--scenario=')) {
      const value = arg.split('=')[1];
      if (value !== 'single' && value !== 'balanced') {
        throw new Error(`Invalid scenario: ${value}. Use "single" or "balanced".`);
      }
      scenario = value;
    }
    if (arg.startsWith('--script=')) {
      script = arg.split('=')[1];
    }
  }

  return { scenario, script };
}

function checkK6() {
  try {
    execSync('k6 version', { stdio: 'pipe' });
  } catch {
    throw new Error(
      'k6 is not installed or not in PATH. Install it from https://grafana.com/docs/k6/latest/set-up/install-k6/',
    );
  }
}

function buildK6Scenarios() {
  console.log('Building k6 scenarios...');
  execSync('node test/load/esbuild.config.mjs', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

async function runSeed(
  host: string,
  port: number,
  jwtKeys: { privateKeyBase64: string; publicKeyBase64: string },
) {
  console.log('Seeding database...');
  execSync('npx ts-node -r tsconfig-paths/register src/infra/database/seed/seed-up.ts', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      POSTGRES_HOST: host,
      POSTGRES_PORT: String(port),
      POSTGRES_USER: POSTGRES_CREDENTIALS.user,
      POSTGRES_PASS: POSTGRES_CREDENTIALS.password,
      POSTGRES_DB_NAME: POSTGRES_CREDENTIALS.database,
      APP_ENV: 'test',
      PORT: '3000',
      JWT_PRIVATE_KEY_BASE_64: jwtKeys.privateKeyBase64,
      JWT_PUBLIC_KEY_BASE_64: jwtKeys.publicKeyBase64,
      WHATSAPP_API_URL: 'http://localhost:9999',
      WHATSAPP_API_KEY: 'dummy',
    },
  });
}

async function main() {
  const { scenario, script } = parseArgs();

  console.log(`\n=== Load Test Runner ===`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Script: ${script}`);
  console.log('========================\n');

  checkK6();
  buildK6Scenarios();

  const scriptPath = resolve(process.cwd(), `test/load/dist/${script}.js`);

  let network: StartedNetwork | undefined;
  let postgres: StartedPostgreSqlContainer | undefined;
  let apiContainers: StartedTestContainer[] = [];
  let nginx: StartedTestContainer | undefined;

  try {
    // 1. Load JWT keys from .env.test
    console.log('\n[1/7] Loading JWT keys from .env.test...');
    const jwtKeys = loadJwtKeys();

    // 2. Create Docker network
    console.log('[2/7] Creating Docker network...');
    network = await createNetwork();

    // 3. Start PostgreSQL
    console.log('[3/7] Starting PostgreSQL...');
    postgres = await createPostgres(network);
    const pgHost = postgres.getHost();
    const pgPort = postgres.getPort();
    console.log(`  PostgreSQL available at ${pgHost}:${pgPort}`);

    // 4. Run migrations
    console.log('[4/7] Running migrations...');
    await runMigrations({
      host: pgHost,
      port: pgPort,
      user: POSTGRES_CREDENTIALS.user,
      password: POSTGRES_CREDENTIALS.password,
      database: POSTGRES_CREDENTIALS.database,
    });

    // 5. Seed database
    console.log('[5/7] Seeding database...');
    await runSeed(pgHost, pgPort, jwtKeys);

    // 6. Start API container(s)
    console.log(`[6/7] Starting API container(s) (${scenario})...`);
    apiContainers = await createApiContainers({
      network,
      scenario,
      jwtKeys,
    });
    for (const api of apiContainers) {
      console.log(`  API available at ${api.getHost()}:${api.getMappedPort(3000)}`);
    }

    // 7. Start Nginx
    console.log('[7/7] Starting Nginx...');
    nginx = await createNginx(network, scenario);
    const nginxHost = nginx.getHost();
    const nginxPort = nginx.getMappedPort(80);
    const baseUrl = `http://${nginxHost}:${nginxPort}`;
    console.log(`  Nginx available at ${baseUrl}`);

    // Run k6
    console.log(`\n=== Running k6: ${script} ===\n`);
    const exitCode = await spawnK6({
      scriptPath,
      baseUrl,
      testEmail: 'demo@cresc.campo',
      testPassword: 'password123',
      scriptName: script,
      scenario,
    });

    if (exitCode !== 0) {
      console.error(`\nk6 exited with code ${exitCode}`);
    }

    process.exitCode = exitCode;
  } catch (error) {
    console.error('\nLoad test failed:', error);
    process.exitCode = 1;
  } finally {
    console.log('\n=== Teardown ===');

    if (nginx) {
      console.log('Stopping Nginx...');
      await nginx.stop().catch((e) => console.error('Failed to stop Nginx:', e));
    }

    for (const api of apiContainers) {
      console.log('Stopping API container...');
      await api.stop().catch((e) => console.error('Failed to stop API:', e));
    }

    if (postgres) {
      console.log('Stopping PostgreSQL...');
      await postgres.stop().catch((e) => console.error('Failed to stop PostgreSQL:', e));
    }

    if (network) {
      console.log('Removing network...');
      await network.stop().catch((e) => console.error('Failed to remove network:', e));
    }

    console.log('Teardown complete.\n');
  }
}

main();

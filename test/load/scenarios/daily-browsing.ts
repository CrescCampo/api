// TC-022 | Daily Browsing — navegação diária de harvests e transactions
import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

export const options: Options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export function setup(): AuthData {
  return { token: getToken(__ENV.TEST_EMAIL, __ENV.TEST_PASSWORD) };
}

export default function (data: AuthData): void {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. List harvests (first page)
  const harvestsRes = http.get(`${BASE_URL}/harvests?page=1&pageSize=10`, {
    headers,
  });
  check(harvestsRes, {
    'list harvests - status 200': r => r.status === 200,
    'list harvests - has data': r => r.json('harvests') !== undefined,
  });

  // 2. Pick the first harvest and get its transactions
  const harvests = harvestsRes.json('harvests') as
    | Array<{ id: string }>
    | undefined;
  if (harvests && harvests.length > 0) {
    const harvestId = harvests[0].id;

    sleep(0.3);

    const txRes = http.get(
      `${BASE_URL}/harvests/${harvestId}/transactions?page=1&pageSize=10`,
      { headers },
    );
    check(txRes, {
      'harvest transactions - status 200': r => r.status === 200,
      'harvest transactions - has data': r =>
        r.json('transactions') !== undefined,
    });
  }

  // 3. Browse second page of harvests
  sleep(0.3);

  const page2Res = http.get(`${BASE_URL}/harvests?page=2&pageSize=10`, {
    headers,
  });
  check(page2Res, {
    'harvests page 2 - status 200': r => r.status === 200,
  });

  // 4. List all transactions
  sleep(0.3);

  const allTxRes = http.get(`${BASE_URL}/transactions?page=1&pageSize=10`, {
    headers,
  });
  check(allTxRes, {
    'list transactions - status 200': r => r.status === 200,
    'list transactions - has data': r => r.json('transactions') !== undefined,
  });

  sleep(1);
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

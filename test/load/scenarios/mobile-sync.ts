// TC-023 | Mobile Sync — sincronização push/pull do app móvel
import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

export const options: Options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
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

  // 1. Full pull (simulates app opening and syncing all data)
  const pullRes = http.get(`${BASE_URL}/app/pull`, { headers });
  check(pullRes, {
    'pull - status 200': r => r.status === 200,
    'pull - has cultures': r => r.json('cultures') !== undefined,
    'pull - has harvests': r => r.json('harvests') !== undefined,
    'pull - has transactions': r => r.json('transactions') !== undefined,
    'pull - has categories': r => r.json('categories') !== undefined,
  });

  // Simulates user reading data on the app
  sleep(2);

  // 2. Second pull (simulates background refresh)
  const refreshRes = http.get(`${BASE_URL}/app/pull`, { headers });
  check(refreshRes, {
    'refresh pull - status 200': r => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

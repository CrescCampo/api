// TC-021 | Onboarding — registro de novos usuários sob carga
import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

export const options: Options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

export default function (): void {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `farmer-${uniqueId}@loadtest.com`;
  const password = 'LoadTest123!';
  const name = `Farmer ${uniqueId}`;

  // 1. Register
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ name, email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, {
    'register - status 201': r => r.status === 201,
    'register - has userId': r => r.json('userId') !== undefined,
  });

  sleep(0.5);

  // 2. Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, {
    'login - status 201': r => r.status === 201,
    'login - has token': r => r.json('token') !== undefined,
  });

  sleep(0.5);
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

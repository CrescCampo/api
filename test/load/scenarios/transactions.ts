import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

export const options: Options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
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

  const listRes = http.get(`${BASE_URL}/transactions?page=1&pageSize=10`, {
    headers,
  });
  check(listRes, {
    'list transactions - status 200': r => r.status === 200,
    'list transactions - has transactions field': r =>
      r.json('transactions') !== null,
  });

  sleep(1);
}

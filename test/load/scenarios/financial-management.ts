// TC-024 | Financial Management — CRUD de transações sob carga
import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

interface SetupData extends AuthData {
  transactionIds: string[];
  categoryIds: string[];
}

export const options: Options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.95'],
  },
};

export function setup(): SetupData {
  const token = getToken(__ENV.TEST_EMAIL, __ENV.TEST_PASSWORD);
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Fetch existing transactions to get IDs
  const res = http.get(`${BASE_URL}/transactions?page=1&pageSize=50`, {
    headers,
  });

  const transactions = res.json('transactions') as
    | Array<{ id: string; categoryId: string }>
    | undefined;
  const transactionIds = transactions ? transactions.map(t => t.id) : [];
  const categoryIds = transactions
    ? [...new Set(transactions.map(t => t.categoryId))]
    : [];

  return { token, transactionIds, categoryIds };
}

export default function (data: SetupData): void {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  if (data.transactionIds.length === 0) return;

  // Pick a random transaction
  const txId =
    data.transactionIds[Math.floor(Math.random() * data.transactionIds.length)];
  const categoryId =
    data.categoryIds.length > 0
      ? data.categoryIds[Math.floor(Math.random() * data.categoryIds.length)]
      : undefined;

  // 1. Edit transaction description and amount
  const editRes = http.patch(
    `${BASE_URL}/transactions/${txId}`,
    JSON.stringify({
      description: `Updated by VU ${__VU} iter ${__ITER}`,
      amount: Math.floor(Math.random() * 5000) + 100,
      ...(categoryId ? { categoryId } : {}),
    }),
    { headers },
  );
  check(editRes, {
    'edit transaction - status 200': r => r.status === 200,
  });

  sleep(0.5);

  // 2. List transactions to verify
  const listRes = http.get(`${BASE_URL}/transactions?page=1&pageSize=10`, {
    headers,
  });
  check(listRes, {
    'list after edit - status 200': r => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

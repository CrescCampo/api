import http from 'k6/http';
import { check } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

const FEEDBACK_CATEGORIES = [
  'product_quality',
  'delivery',
  'service',
  'price',
  'other',
];

interface SetupData extends AuthData {
  transactionIds: string[];
  categoryIds: string[];
}

export const options: Options = {
  scenarios: {
    new_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 15 },
        { duration: '2m', target: 15 },
        { duration: '10s', target: 0 },
      ],
      exec: 'onboarding',
    },
    sync_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 25 },
        { duration: '2m', target: 25 },
        { duration: '10s', target: 0 },
      ],
      exec: 'mobileSync',
    },
    browsers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '10s', target: 0 },
      ],
      exec: 'browsing',
    },
    editors: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'editing',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
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

  const res = http.get(`${BASE_URL}/transactions?page=1&pageSize=50`, {
    headers,
  });

  const transactions = res.json('transactions') as
    | Array<{ id: string; categoryId: string }>
    | undefined;
  const transactionIds = transactions ? transactions.map((t) => t.id) : [];
  const categoryIds = transactions
    ? [...new Set(transactions.map((t) => t.categoryId))]
    : [];

  return { token, transactionIds, categoryIds };
}

// --- Scenario: new users registering (CPU-heavy bcrypt) ---
export function onboarding(): void {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `peak-${uniqueId}@loadtest.com`;
  const password = 'LoadTest123!';

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ name: `Peak User ${uniqueId}`, email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, {
    'register - status 201': (r) => r.status === 201,
  });

  // bcrypt.compare on login is also CPU-heavy — minimal gap
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, {
    'login - status 201': (r) => r.status === 201,
    'login - has token': (r) => r.json('token') !== undefined,
  });
}

// --- Scenario: mobile sync (heavy payload + multiple queries) ---
export function mobileSync(data: SetupData): void {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Triple pull — no breathing room
  const pull1 = http.get(`${BASE_URL}/app/pull`, { headers });
  check(pull1, {
    'pull - status 200': (r) => r.status === 200,
  });

  const pull2 = http.get(`${BASE_URL}/app/pull`, { headers });
  check(pull2, {
    'refresh - status 200': (r) => r.status === 200,
  });

  const pull3 = http.get(`${BASE_URL}/app/pull`, { headers });
  check(pull3, {
    'pull 3 - status 200': (r) => r.status === 200,
  });
}

// --- Scenario: browsing harvests and transactions (read pressure) ---
export function browsing(data: SetupData): void {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  const harvestsRes = http.get(
    `${BASE_URL}/harvests?page=1&pageSize=10`,
    { headers },
  );
  check(harvestsRes, {
    'list harvests - status 200': (r) => r.status === 200,
  });

  const harvests = harvestsRes.json('harvests') as
    | Array<{ id: string }>
    | undefined;
  if (harvests && harvests.length > 0) {
    const harvestId = harvests[Math.floor(Math.random() * harvests.length)].id;

    const txRes = http.get(
      `${BASE_URL}/harvests/${harvestId}/transactions?page=1&pageSize=10`,
      { headers },
    );
    check(txRes, {
      'harvest transactions - status 200': (r) => r.status === 200,
    });
  }

  const allTxRes = http.get(
    `${BASE_URL}/transactions?page=1&pageSize=10`,
    { headers },
  );
  check(allTxRes, {
    'list transactions - status 200': (r) => r.status === 200,
  });

  // Feedback write to add more pressure
  const res = http.post(
    `${BASE_URL}/feedbacks`,
    JSON.stringify({
      rating: Math.floor(Math.random() * 6),
      description: `Peak traffic feedback VU ${__VU}`,
      category:
        FEEDBACK_CATEGORIES[
          Math.floor(Math.random() * FEEDBACK_CATEGORIES.length)
        ],
    }),
    { headers },
  );
  check(res, {
    'feedback - status 201': (r) => r.status === 201,
  });
}

// --- Scenario: editing transactions (write contention) ---
export function editing(data: SetupData): void {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  if (data.transactionIds.length === 0) return;

  const txId =
    data.transactionIds[
      Math.floor(Math.random() * data.transactionIds.length)
    ];
  const categoryId =
    data.categoryIds.length > 0
      ? data.categoryIds[Math.floor(Math.random() * data.categoryIds.length)]
      : undefined;

  const editRes = http.patch(
    `${BASE_URL}/transactions/${txId}`,
    JSON.stringify({
      description: `Peak edit VU ${__VU} iter ${__ITER}`,
      amount: Math.floor(Math.random() * 5000) + 100,
      ...(categoryId ? { categoryId } : {}),
    }),
    { headers },
  );
  check(editRes, {
    'edit transaction - status 200': (r) => r.status === 200,
  });

  const listRes = http.get(
    `${BASE_URL}/transactions?page=1&pageSize=10`,
    { headers },
  );
  check(listRes, {
    'list after edit - status 200': (r) => r.status === 200,
  });
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

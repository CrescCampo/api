// TC-025 | Feedback Burst — rajada de envio de feedbacks
import http from 'k6/http';
import { check, sleep } from 'k6';
import type { Options } from 'k6/options';
import { getToken, type AuthData } from '../auth.js';
import { generateSummary } from '../summary.js';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

const CATEGORIES = ['product_quality', 'delivery', 'service', 'price', 'other'];
const DESCRIPTIONS = [
  'Excelente qualidade dos produtos, muito frescos!',
  'Entrega rapida e bem embalada.',
  'Atendimento muito bom, recomendo.',
  'Preco justo pelo que oferece.',
  'Poderia melhorar a variedade de produtos.',
  'Otima experiencia, voltarei a comprar.',
  'Demorou um pouco mas chegou bem.',
  'Produtos organicos de alta qualidade.',
];

export const options: Options = {
  stages: [
    { duration: '15s', target: 15 },
    { duration: '1m', target: 15 },
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

  const rating = Math.floor(Math.random() * 6); // 0-5
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const description =
    DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

  const res = http.post(
    `${BASE_URL}/feedbacks`,
    JSON.stringify({ rating, description, category }),
    { headers },
  );
  check(res, {
    'send feedback - status 201': r => r.status === 201,
    'send feedback - has feedbackId': r => r.json('feedbackId') !== undefined,
  });

  sleep(0.5);
}

export function handleSummary(data: Record<string, unknown>) {
  return generateSummary(data);
}

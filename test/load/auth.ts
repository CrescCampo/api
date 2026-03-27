import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:5000';

export interface AuthData {
  token: string;
}

export function getToken(email: string, password: string): string {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return res.json('token') as string;
}

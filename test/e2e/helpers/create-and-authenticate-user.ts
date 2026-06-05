import request from 'supertest';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';

interface Overrides {
  name?: string;
  email?: string;
  password?: string;
}

export default async function createAndAuthenticateUser(
  app: INestApplication,
  overrides: Overrides = {},
): Promise<string> {
  const name = overrides.name ?? 'Usuário Teste';
  const email = overrides.email ?? `user-${randomUUID()}@teste.com`;
  const password = overrides.password ?? 'senha-muito-segura123';

  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password });

  if (registerResponse.status !== 201) {
    throw new Error(
      `Failed to register test user (${email}): ${registerResponse.status} ${JSON.stringify(
        registerResponse.body,
      )}`,
    );
  }

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  if (!loginResponse.body?.token) {
    throw new Error(
      `Failed to authenticate test user (${email}): ${loginResponse.status} ${JSON.stringify(
        loginResponse.body,
      )}`,
    );
  }

  return loginResponse.body.token;
}

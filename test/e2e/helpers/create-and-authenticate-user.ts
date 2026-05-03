import request from 'supertest';
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
  const email = overrides.email ?? 'user@teste.com';
  const password = overrides.password ?? 'senha-muito-segura123';

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ name, email, password });

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return loginResponse.body.token;
}

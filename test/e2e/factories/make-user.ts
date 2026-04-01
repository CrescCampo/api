import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface UserData {
  name: string;
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  token: string;
  userId: string;
  name: string;
  email: string;
  password: string;
  farmId: string;
}

let userCounter = 0;

export function makeUser(overrides?: Partial<UserData>): UserData {
  userCounter++;
  return {
    name: overrides?.name ?? `Farmer ${userCounter}`,
    email: overrides?.email ?? `farmer.${userCounter}.${Date.now()}@teste.com`,
    password: overrides?.password ?? 'senha-segura-123',
  };
}

export async function registerAndAuthenticate(
  app: INestApplication,
  overrides?: Partial<UserData>,
): Promise<AuthenticatedUser> {
  const user = makeUser(overrides);

  await request(app.getHttpServer()).post('/auth/register').send(user);

  const loginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: user.email, password: user.password });

  return {
    token: loginRes.body.token,
    userId: loginRes.body.userId,
    name: user.name,
    email: user.email,
    password: user.password,
    farmId: loginRes.body.farmId,
  };
}

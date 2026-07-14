import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';

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

export async function markEmailVerified(
  app: INestApplication,
  email: string,
): Promise<void> {
  const farmerRepository = app.get(FarmerRepository);
  const farmer = await farmerRepository.findByEmail(email);

  if (!farmer) {
    throw new Error(`Farmer not found for email ${email}`);
  }

  farmer.verifyEmail();
  await farmerRepository.save(farmer);
}

export async function registerAndAuthenticate(
  app: INestApplication,
  overrides?: Partial<UserData>,
): Promise<AuthenticatedUser> {
  const user = makeUser(overrides);

  await request(app.getHttpServer()).post('/auth/register').send(user);

  await markEmailVerified(app, user.email);

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

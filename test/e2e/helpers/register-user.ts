import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import seedInvite from './seed-invite';

interface RegisterUserBody {
  name: string;
  email: string;
  password: string;
}

export default async function registerUser(
  app: INestApplication,
  user: RegisterUserBody,
) {
  const inviteCode = await seedInvite();

  return request(app.getHttpServer())
    .post('/auth/register')
    .send({ ...user, inviteCode });
}

import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export default async function createAndAuthenticateUser(
  app: INestApplication,
): Promise<string> {
  await request(app.getHttpServer()).post('/auth/register').send({
    name: 'Usuário Teste',
    email: 'user@teste.com',
    password: 'senha-muito-segura123',
  });

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: 'user@teste.com',
      password: 'senha-muito-segura123',
    });

  return loginResponse.body.token;
}

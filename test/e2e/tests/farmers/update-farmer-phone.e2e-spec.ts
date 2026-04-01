import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import {
  registerAndAuthenticate,
  AuthenticatedUser,
} from '../../factories/make-user';

describe('Update Farmer Phone Controller (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let user: AuthenticatedUser;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    user = await registerAndAuthenticate(app);
    token = user.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('[PATCH] /farmers/phone — deve atualizar telefone e retornar farmerId (200)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farmers/phone')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+5511999999999' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('farmerId');
    expect(typeof response.body.farmerId).toBe('string');
  });

  it('[PATCH] /farmers/phone — deve refletir telefone no login subsequente', async () => {
    await request(app.getHttpServer())
      .patch('/farmers/phone')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+5521988888888' });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });

    expect(loginRes.status).toBe(201);
    expect(loginRes.body.phone).toBe('+5521988888888');
  });

  it('[PATCH] /farmers/phone — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farmers/phone')
      .send({ phone: '+5511999999999' });

    expect(response.status).toBe(401);
  });

  it('[PATCH] /farmers/phone — deve rejeitar telefone sem prefixo + (400)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farmers/phone')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '5511999999999' });

    expect(response.status).toBe(400);
  });

  it('[PATCH] /farmers/phone — deve rejeitar telefone com letras (400)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farmers/phone')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+55abc999999' });

    expect(response.status).toBe(400);
  });
});

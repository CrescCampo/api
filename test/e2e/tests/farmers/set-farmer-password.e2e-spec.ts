import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { registerAndAuthenticate } from '../../factories/make-user';

describe('Set Farmer Password Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /farmers/password — deve exigir autenticação (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/farmers/password')
      .send({ newPassword: 'novaSenha@123' });

    expect(response.status).toBe(401);
  });

  it('[POST] /farmers/password — deve exigir senha atual quando a conta já tem senha (400)', async () => {
    const user = await registerAndAuthenticate(app);

    const response = await request(app.getHttpServer())
      .post('/farmers/password')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ newPassword: 'novaSenha@123' });

    expect(response.status).toBe(400);
  });

  it('[POST] /farmers/password — deve alterar a senha com a senha atual correta (204)', async () => {
    const user = await registerAndAuthenticate(app);
    const newPassword = 'novaSenha@123';

    const response = await request(app.getHttpServer())
      .post('/farmers/password')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ currentPassword: user.password, newPassword });

    expect(response.status).toBe(204);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: newPassword });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.hasPassword).toBe(true);
  });

  it('[POST] /farmers/password — deve rejeitar senha atual incorreta (401)', async () => {
    const user = await registerAndAuthenticate(app);

    const response = await request(app.getHttpServer())
      .post('/farmers/password')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ currentPassword: 'errada', newPassword: 'novaSenha@123' });

    expect(response.status).toBe(401);
  });
});

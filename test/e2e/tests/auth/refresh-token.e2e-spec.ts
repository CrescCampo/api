import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

const USER = makeUser({ name: 'Farmer Refresh' });

describe('Refresh Token Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    await request(app.getHttpServer()).post('/auth/register').send(USER);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login() {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER.email, password: USER.password });

    return response.body.refreshToken as string;
  }

  it('[POST] /auth/refresh — deve rotacionar o token e retornar novos tokens (200)', async () => {
    const refreshToken = await login();

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(typeof response.body.refreshToken).toBe('string');
    expect(response.body).toHaveProperty('refreshTokenExpiresAt');
    expect(response.body.refreshToken).not.toBe(refreshToken);
  });

  it('[POST] /auth/refresh — deve rejeitar token inexistente (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'token-que-nao-existe' });

    expect(response.status).toBe(401);
  });

  it('[POST] /auth/refresh — deve rejeitar body vazio (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({});

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/refresh — deve detectar reuso e revogar a família (401)', async () => {
    const refreshToken = await login();

    const first = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(first.status).toBe(200);

    const reuse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken });
    expect(reuse.status).toBe(401);

    const replacement = first.body.refreshToken as string;
    const afterReuse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: replacement });
    expect(afterReuse.status).toBe(401);
  });
});

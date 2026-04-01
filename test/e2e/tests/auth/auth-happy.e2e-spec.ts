import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';

const VALID_USER = {
  name: 'Maria Tester',
  email: `maria.tester.${Date.now()}@exemplo.com`,
  password: 'senha-segura-123',
};

describe('Auth — Caminho Feliz (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });
  afterAll(async () => {
    await app.close();
  });
  it('TC-001 | [POST] /auth/register — deve registrar um novo usuário e retornar userId', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(VALID_USER);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(typeof response.body.userId).toBe('string');
    expect(response.body.userId.length).toBeGreaterThan(0);
  });
  it('TC-002 | [POST] /auth/login — deve autenticar e retornar token e dados do usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
    expect(response.body).toHaveProperty('name', VALID_USER.name);
    expect(response.body).toHaveProperty('email', VALID_USER.email);
    expect(response.body).toHaveProperty('farmId');
  });
});

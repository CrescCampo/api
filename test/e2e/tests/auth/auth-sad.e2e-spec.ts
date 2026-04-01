import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';

const EXISTING_USER = {
  name: 'Usuário Existente',
  email: 'existente@exemplo.com',
  password: 'senha-correta-456',
};

describe('Auth — Caminhos Tristes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(EXISTING_USER);
  });
  afterAll(async () => {
    await app.close();
  });
  it('TC-003 | [POST] /auth/register — deve rejeitar email com formato inválido (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Qualquer Nome',
        email: 'isso-nao-e-um-email',
        password: 'qualquer-senha',
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
  it('TC-004 | [POST] /auth/register — deve rejeitar email já cadastrado', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(EXISTING_USER);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
  it('TC-005 | [POST] /auth/login — deve rejeitar senha incorreta (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: EXISTING_USER.email,
        password: 'senha-completamente-errada',
      });

    expect(response.status).toBe(401);
  });
  it('TC-006 | [POST] /auth/login — deve rejeitar email inexistente (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nao-existe@exemplo.com',
        password: 'qualquer-coisa',
      });

    expect(response.status).toBe(401);
  });
  it('TC-007 | [POST] /auth/register - deve rejeitar body vazio', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.message[0]).toBe('name must be a string');
  });
});

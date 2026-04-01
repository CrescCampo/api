import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

const VALID_USER = makeUser({ name: 'Farmer Registro' });

describe('Register Farmer Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /auth/register — deve registrar novo usuário e retornar userId (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(VALID_USER);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(typeof response.body.userId).toBe('string');
    expect(response.body.userId.length).toBeGreaterThan(0);
  });

  it('[POST] /auth/register — deve criar culturas e categorias padrão ao registrar', async () => {
    const uniqueUser = {
      name: 'Farmer Defaults',
      email: `defaults.${Date.now()}@exemplo.com`,
      password: 'senha-123',
    };

    await request(app.getHttpServer()).post('/auth/register').send(uniqueUser);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueUser.email, password: uniqueUser.password });

    const { token } = loginRes.body;

    const pullRes = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.cultures.length).toBe(4);
    expect(pullRes.body.transactionCategories.length).toBe(6);
  });

  it('[POST] /auth/register — deve rejeitar email com formato inválido (400)', async () => {
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

  it('[POST] /auth/register — deve rejeitar email já cadastrado (409)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(VALID_USER);

    expect(response.status).toBe(409);
  });

  it('[POST] /auth/register — deve rejeitar body vazio (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('name must be a string');
  });

  it('[POST] /auth/register — deve rejeitar body sem password (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Nome', email: 'valido@email.com' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});

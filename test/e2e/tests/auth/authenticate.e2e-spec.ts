import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

const USER = makeUser({ name: 'Farmer Auth' });
const DISABLED_USER = makeUser({
  name: 'Farmer Disabled',
  email: `disabled.${Date.now()}@exemplo.com`,
});

describe('Authenticate Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    await request(app.getHttpServer()).post('/auth/register').send(USER);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(DISABLED_USER);

    const farmerRepository = app.get(FarmerRepository);
    const farmer = await farmerRepository.findByEmail(DISABLED_USER.email);
    if (farmer) {
      farmer.disable();
      await farmerRepository.save(farmer);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /auth/login — deve autenticar e retornar token, dados do usuário e farmId (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER.email, password: USER.password });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
    expect(response.body).toHaveProperty('name', USER.name);
    expect(response.body).toHaveProperty('email', USER.email);
    expect(response.body).toHaveProperty('farmId');
  });

  it('[POST] /auth/login — deve retornar phone=null quando farmer não tem telefone', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER.email, password: USER.password });

    expect(response.status).toBe(201);
    expect(response.body.phone).toBeNull();
  });

  it('[POST] /auth/login — deve rejeitar senha incorreta (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER.email, password: 'senha-errada' });

    expect(response.status).toBe(401);
  });

  it('[POST] /auth/login — deve rejeitar email inexistente (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nao-existe@exemplo.com', password: 'qualquer' });

    expect(response.status).toBe(401);
  });

  it('[POST] /auth/login — deve rejeitar body vazio (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({});

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/login — deve rejeitar email com formato inválido (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'invalido', password: 'qualquer' });

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/login — deve rejeitar farmer desabilitado (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: DISABLED_USER.email,
        password: DISABLED_USER.password,
      });

    expect(response.status).toBe(401);
  });
});

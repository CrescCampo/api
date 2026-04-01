import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import { seedFullDataSet } from '../../helpers/seed-data';

describe('Get Transactions Controller (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    token = await createAndAuthenticateUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('[GET] /transactions — deve retornar transações paginadas com defaults (200)', async () => {
    await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 200, description: 'Semente' },
    });

    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toBeInstanceOf(Array);
    expect(response.body.transactions.length).toBeGreaterThanOrEqual(1);
    expect(response.body.pagination).toHaveProperty('meta');
    expect(response.body.pagination.meta.currentPage).toBe(1);
  });

  it('[GET] /transactions — deve filtrar transações por type=revenue (200)', async () => {
    await seedFullDataSet(app, token, {
      transaction: { type: 'revenue', amount: 1000, description: 'Venda' },
    });

    const response = await request(app.getHttpServer())
      .get('/transactions')
      .query({ type: 'revenue' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    response.body.transactions.forEach((t: any) => {
      expect(t.type).toBe('revenue');
    });
  });

  it('[GET] /transactions — deve retornar lista vazia quando filtro não encontra resultados (200)', async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    token = await createAndAuthenticateUser(app);

    const response = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toEqual([]);
    expect(response.body.pagination.meta.totalItems).toBe(0);
  });

  it('[GET] /transactions — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).get('/transactions');

    expect(response.status).toBe(401);
  });

  it('[GET] /transactions — deve rejeitar page=0 (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .query({ page: 0 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message[0]).toBe('page must not be less than 1');
  });

  it('[GET] /transactions — deve rejeitar type inválido (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .query({ type: 'invalido' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

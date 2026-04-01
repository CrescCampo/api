import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import { seedFullDataSet } from '../../helpers/seed-data';

describe('Pull Controller (e2e)', () => {
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

  it('[GET] /app/pull — deve retornar culturas padrão, categorias e listas vazias para usuário novo (200)', async () => {
    const response = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.cultures).toBeInstanceOf(Array);
    expect(response.body.cultures.length).toBe(4);
    expect(response.body.transactionCategories).toBeInstanceOf(Array);
    expect(response.body.transactionCategories.length).toBe(6);
    expect(response.body.activeHarvests).toEqual([]);
    expect(response.body.transactions).toEqual([]);
  });

  it('[GET] /app/pull — deve retornar harvests, transactions e totais após push de dados (200)', async () => {
    await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 500 },
    });

    const response = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.recentHarvests.length).toBeGreaterThanOrEqual(1);
    expect(response.body.transactions.length).toBeGreaterThanOrEqual(1);
    expect(response.body.totalExpenses).toBeGreaterThanOrEqual(500);
  });

  it('[GET] /app/pull — deve retornar totalProfit = totalRevenue - totalExpenses', async () => {
    const response = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totalProfit).toBe(
      response.body.totalRevenue - response.body.totalExpenses,
    );
  });

  it('[GET] /app/pull — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).get('/app/pull');

    expect(response.status).toBe(401);
  });
});

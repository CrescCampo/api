import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import {
  seedCulture,
  seedHarvest,
  seedTransaction,
  seedTransactionCategory,
} from '../../helpers/seed-data';

describe('Get Harvest Transactions Controller (e2e)', () => {
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

  it('[GET] /harvests/:harvestId/transactions — deve retornar transações paginadas de um harvest (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'HarvTx' });
    const harvest = await seedHarvest(app, token, culture.id);
    const category = await seedTransactionCategory(app, token);
    await seedTransaction(app, token, harvest.id, category.id, {
      description: 'Tx do harvest',
    });

    const response = await request(app.getHttpServer())
      .get(`/harvests/${harvest.id}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toBeInstanceOf(Array);
    expect(response.body.transactions.length).toBe(1);
    expect(response.body.pagination.meta.currentPage).toBe(1);
    expect(response.body.pagination.meta.totalItems).toBe(1);
  });

  it('[GET] /harvests/:harvestId/transactions — deve retornar lista vazia para harvest sem transações (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Vazio HT' });
    const harvest = await seedHarvest(app, token, culture.id);

    const response = await request(app.getHttpServer())
      .get(`/harvests/${harvest.id}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toEqual([]);
    expect(response.body.pagination.meta.totalItems).toBe(0);
  });

  it('[GET] /harvests/:harvestId/transactions — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).get(
      '/harvests/00000000-0000-0000-0000-000000000000/transactions',
    );

    expect(response.status).toBe(401);
  });

  it('[GET] /harvests/:harvestId/transactions — deve rejeitar harvest ID inexistente (404)', async () => {
    const response = await request(app.getHttpServer())
      .get('/harvests/00000000-0000-0000-0000-000000000000/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('[GET] /harvests/:harvestId/transactions — deve retornar 404 ao acessar harvest de outro usuário', async () => {
    const otherToken = await createAndAuthenticateUser(app, {
      email: 'cross-tenant-htx@teste.com',
    });
    const culture = await seedCulture(app, otherToken, {
      name: 'CrossTenant',
    });
    const otherHarvest = await seedHarvest(app, otherToken, culture.id);

    const response = await request(app.getHttpServer())
      .get(`/harvests/${otherHarvest.id}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('[GET] /harvests/:harvestId/transactions — deve rejeitar page=0 (400)', async () => {
    const culture = await seedCulture(app, token, { name: 'Page0' });
    const harvest = await seedHarvest(app, token, culture.id);

    const response = await request(app.getHttpServer())
      .get(`/harvests/${harvest.id}/transactions`)
      .query({ page: 0 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

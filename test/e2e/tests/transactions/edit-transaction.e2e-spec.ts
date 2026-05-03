import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import {
  seedFullDataSet,
  seedTransactionCategory,
} from '../../helpers/seed-data';

describe('Edit Transaction Controller (e2e)', () => {
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

  it('[PATCH] /transactions/:id — deve atualizar descrição da transação (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token);

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Descrição atualizada' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transactionId', transaction.id);
  });

  it('[PATCH] /transactions/:id — deve atualizar amount e refletir no harvest (200)', async () => {
    const { transaction, harvest } = await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 100 },
    });

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 300 });

    expect(response.status).toBe(200);

    const pullRes = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    const updatedHarvest = pullRes.body.recentHarvests.find(
      (h: any) => h.id === harvest.id,
    );
    expect(updatedHarvest.expenses).toBe(300);
  });

  it('[PATCH] /transactions/:id — deve atualizar type de EXPENSE para REVENUE (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 150 },
    });

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'revenue' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transactionId', transaction.id);
  });

  it('[PATCH] /transactions/:id — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/transactions/${randomUUID()}`)
      .send({ description: 'Qualquer' });

    expect(response.status).toBe(401);
  });

  it('[PATCH] /transactions/:id — deve rejeitar ID inexistente (404)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Qualquer' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found');
  });

  it('[PATCH] /transactions/:id — deve rejeitar amount negativo (400)', async () => {
    const { transaction } = await seedFullDataSet(app, token);

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -10 });

    expect(response.status).toBe(400);
  });

  it('[PATCH] /transactions/:id — deve rejeitar categoryId inexistente (404)', async () => {
    const { transaction } = await seedFullDataSet(app, token);

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: randomUUID() });

    expect(response.status).toBe(404);
  });

  it('[PATCH] /transactions/:id — deve atualizar apenas date (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token);
    const newDate = new Date('2024-06-15T10:00:00Z').getTime();

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: newDate });

    expect(response.status).toBe(200);

    const listRes = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);
    const persisted = listRes.body.transactions.find(
      (t: any) => t.id === transaction.id,
    );
    expect(persisted.date).toBe(newDate);
  });

  it('[PATCH] /transactions/:id — deve atualizar apenas categoryId válido (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token);
    const newCategory = await seedTransactionCategory(app, token, {
      name: 'Nova Categoria',
    });

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: newCategory.id });

    expect(response.status).toBe(200);

    const listRes = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);
    const persisted = listRes.body.transactions.find(
      (t: any) => t.id === transaction.id,
    );
    expect(persisted.categoryId).toBe(newCategory.id);
  });

  it('[PATCH] /transactions/:id — deve atualizar type+amount juntos e refletir no harvest (200)', async () => {
    const { transaction, harvest } = await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 200 },
    });

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'revenue', amount: 800 });

    expect(response.status).toBe(200);

    const pullRes = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);
    const updatedHarvest = pullRes.body.recentHarvests.find(
      (h: any) => h.id === harvest.id,
    );
    expect(updatedHarvest.expenses).toBe(0);
    expect(updatedHarvest.revenue).toBe(800);
  });

  it('[PATCH] /transactions/:id — deve aceitar body vazio como no-op (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token);

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transactionId', transaction.id);
  });

  it('[PATCH] /transactions/:id — deve retornar 404 ao editar transação de outro usuário', async () => {
    const otherToken = await createAndAuthenticateUser(app, {
      email: 'cross-tenant-edit-tx@teste.com',
    });
    const { transaction } = await seedFullDataSet(app, otherToken);

    const response = await request(app.getHttpServer())
      .patch(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Tentativa cross-tenant' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found');
  });
});

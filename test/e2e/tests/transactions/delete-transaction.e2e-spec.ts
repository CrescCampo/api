import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import { seedFullDataSet } from '../../helpers/seed-data';

describe('Delete Transaction Controller (e2e)', () => {
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

  it('[DELETE] /transactions/:id — deve deletar transação e retornar transactionId (200)', async () => {
    const { transaction } = await seedFullDataSet(app, token);

    const response = await request(app.getHttpServer())
      .delete(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transactionId', transaction.id);
  });

  it('[DELETE] /transactions/:id — deve reverter totais do harvest ao deletar', async () => {
    const { transaction, harvest } = await seedFullDataSet(app, token, {
      transaction: { type: 'expense', amount: 500 },
    });

    const pullBefore = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    const harvestBefore = pullBefore.body.recentHarvests.find(
      (h: any) => h.id === harvest.id,
    );
    const expensesBefore = harvestBefore.expenses;

    await request(app.getHttpServer())
      .delete(`/transactions/${transaction.id}`)
      .set('Authorization', `Bearer ${token}`);

    const pullAfter = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    const harvestAfter = pullAfter.body.recentHarvests.find(
      (h: any) => h.id === harvest.id,
    );
    expect(harvestAfter.expenses).toBe(expensesBefore - 500);
  });

  it('[DELETE] /transactions/:id — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).delete(
      '/transactions/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });

  it('[DELETE] /transactions/:id — deve rejeitar ID inexistente (404)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found');
  });
});

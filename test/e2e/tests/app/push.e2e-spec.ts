import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import {
  seedCulture,
  seedHarvest,
  seedTransactionCategory,
} from '../../helpers/seed-data';
import makeOutboxEvent from '../../factories/make-outbox-event';

describe('Push Controller (e2e)', () => {
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

  it('TC-012 | [POST] /app/push — deve criar cultura via push (201)', async () => {
    const cultureId = randomUUID();
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [makeOutboxEvent('cultures', { id: cultureId, name: 'Milho' })],
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0].entity).toBe('cultures');
  });

  it('[POST] /app/push — deve criar categoria de transação via push', async () => {
    const categoryId = randomUUID();
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('transaction_category', {
            id: categoryId,
            name: 'Fertilizantes',
          }),
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body[0].entity).toBe('transaction_category');
  });

  it('[POST] /app/push — deve criar harvest via push', async () => {
    const culture = await seedCulture(app, token, { name: 'Soja Push' });
    const harvestId = randomUUID();

    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('harvest', {
            id: harvestId,
            name: 'Safra Push',
            cultureId: culture.id,
            startDate: Date.now(),
            revenue: 0,
            expenses: 0,
          }),
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body[0].entity).toBe('harvest');
  });

  it('[POST] /app/push — deve criar transação via push e atualizar totais do harvest', async () => {
    const culture = await seedCulture(app, token, { name: 'Café Push' });
    const harvest = await seedHarvest(app, token, culture.id, {
      name: 'Safra Transação',
    });
    const category = await seedTransactionCategory(app, token, {
      name: 'Insumos Push',
    });

    const transactionId = randomUUID();
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('transaction', {
            id: transactionId,
            harvestId: harvest.id,
            type: 'expense',
            description: 'Compra de insumos',
            amount: 250,
            categoryId: category.id,
            date: Date.now(),
          }),
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body[0].entity).toBe('transaction');

    const pullRes = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    const updatedHarvest = pullRes.body.recentHarvests.find(
      (h: any) => h.id === harvest.id,
    );
    expect(updatedHarvest.expenses).toBe(250);
  });

  it('[POST] /app/push — deve ser idempotente (mesmo event ID não duplica)', async () => {
    const culture = await seedCulture(app, token, { name: 'Idempotente' });
    const eventId = randomUUID();
    const harvestPayload = {
      id: randomUUID(),
      name: 'Safra Idempotente',
      cultureId: culture.id,
      startDate: Date.now(),
      revenue: 0,
      expenses: 0,
    };

    await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({ outbox: [makeOutboxEvent('harvest', harvestPayload, eventId)] });

    const secondResponse = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({ outbox: [makeOutboxEvent('harvest', harvestPayload, eventId)] });

    expect(secondResponse.status).toBe(201);
  });

  it('[POST] /app/push — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .send({ outbox: [] });

    expect(response.status).toBe(401);
  });

  it('[POST] /app/push — deve rejeitar harvest com cultura inexistente (500)', async () => {
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('harvest', {
            id: randomUUID(),
            name: 'Safra Sem Cultura',
            cultureId: randomUUID(),
            startDate: Date.now(),
            revenue: 0,
            expenses: 0,
          }),
        ],
      });

    expect(response.status).toBe(500);
  });

  it('[POST] /app/push — deve rejeitar transação com harvest inexistente (500)', async () => {
    const category = await seedTransactionCategory(app, token, {
      name: 'Cat Invalida',
    });

    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('transaction', {
            id: randomUUID(),
            harvestId: randomUUID(),
            type: 'expense',
            description: 'Sem harvest',
            amount: 100,
            categoryId: category.id,
            date: Date.now(),
          }),
        ],
      });

    expect(response.status).toBe(500);
  });

  it('[POST] /app/push — deve rejeitar transação com categoria inexistente (500)', async () => {
    const culture = await seedCulture(app, token, { name: 'Cat Inex' });
    const harvest = await seedHarvest(app, token, culture.id);

    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          makeOutboxEvent('transaction', {
            id: randomUUID(),
            harvestId: harvest.id,
            type: 'expense',
            description: 'Sem categoria',
            amount: 100,
            categoryId: randomUUID(),
            date: Date.now(),
          }),
        ],
      });

    expect(response.status).toBe(500);
  });

  it('[POST] /app/push — deve rejeitar payload JSON inválido (500)', async () => {
    const response = await request(app.getHttpServer())
      .post('/app/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        outbox: [
          {
            id: randomUUID(),
            event: 'create',
            entity: 'cultures',
            payload: '{invalid-json',
            createdAt: Date.now(),
          },
        ],
      });

    expect(response.status).toBe(500);
  });
});

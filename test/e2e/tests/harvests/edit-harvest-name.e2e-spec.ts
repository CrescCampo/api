import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import { seedCulture, seedHarvest } from '../../helpers/seed-data';

describe('Edit Harvest Name Controller (e2e)', () => {
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

  it('[PATCH] /harvests/:id/name — deve atualizar nome do harvest e retornar harvestId (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Soja Edit' });
    const harvest = await seedHarvest(app, token, culture.id, {
      name: 'Nome Original',
    });

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('harvestId', harvest.id);
  });

  it('[PATCH] /harvests/:id/name — deve persistir o novo nome (verificar via GET /harvests)', async () => {
    const culture = await seedCulture(app, token, { name: 'Persistir' });
    const harvest = await seedHarvest(app, token, culture.id, {
      name: 'Antes',
    });

    await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Depois' });

    const listRes = await request(app.getHttpServer())
      .get('/harvests')
      .query({ search: 'Depois' })
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    const found = listRes.body.harvests.find((h: any) => h.id === harvest.id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Depois');
  });

  it('[PATCH] /harvests/:id/name — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/harvests/00000000-0000-0000-0000-000000000000/name')
      .send({ name: 'Qualquer' });

    expect(response.status).toBe(401);
  });

  it('[PATCH] /harvests/:id/name — deve rejeitar harvest ID inexistente (404)', async () => {
    const response = await request(app.getHttpServer())
      .patch('/harvests/00000000-0000-0000-0000-000000000000/name')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Qualquer' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Harvest not found');
  });

  it('[PATCH] /harvests/:id/name — deve rejeitar nome vazio (400)', async () => {
    const culture = await seedCulture(app, token, { name: 'Vazio' });
    const harvest = await seedHarvest(app, token, culture.id);

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(response.status).toBe(400);
  });
});

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

  it('[PATCH] /harvests/:id/name — deve aceitar nome de 1 caractere (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Min' });
    const harvest = await seedHarvest(app, token, culture.id);

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('harvestId', harvest.id);
  });

  it('[PATCH] /harvests/:id/name — deve aceitar nome de 80 caracteres (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Max' });
    const harvest = await seedHarvest(app, token, culture.id);
    const name80 = 'A'.repeat(80);

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: name80 });

    expect(response.status).toBe(200);
  });

  it('[PATCH] /harvests/:id/name — deve rejeitar nome de 81 caracteres (400)', async () => {
    const culture = await seedCulture(app, token, { name: 'Over' });
    const harvest = await seedHarvest(app, token, culture.id);
    const name81 = 'A'.repeat(81);

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${harvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: name81 });

    expect(response.status).toBe(400);
  });

  it('[PATCH] /harvests/:id/name — deve retornar 404 ao editar harvest de outro usuário', async () => {
    const otherToken = await createAndAuthenticateUser(app, {
      email: 'cross-tenant-edit-harvest@teste.com',
    });
    const culture = await seedCulture(app, otherToken, { name: 'Outro' });
    const otherHarvest = await seedHarvest(app, otherToken, culture.id);

    const response = await request(app.getHttpServer())
      .patch(`/harvests/${otherHarvest.id}/name`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentativa cross-tenant' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Harvest not found');
  });
});

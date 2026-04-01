import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';
import { seedCulture, seedHarvest } from '../../helpers/seed-data';

describe('Get Harvests Controller (e2e)', () => {
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

  it('[GET] /harvests — deve retornar harvests paginados com defaults (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Soja Harvests' });
    await seedHarvest(app, token, culture.id, { name: 'Safra 2025' });

    const response = await request(app.getHttpServer())
      .get('/harvests')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.harvests).toBeInstanceOf(Array);
    expect(response.body.harvests.length).toBeGreaterThanOrEqual(1);
    expect(response.body.pagination.meta.currentPage).toBe(1);
  });

  it('[GET] /harvests — deve filtrar harvests por search term (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Milho Search' });
    await seedHarvest(app, token, culture.id, { name: 'Safra Especial 2026' });

    const response = await request(app.getHttpServer())
      .get('/harvests')
      .query({ search: 'Especial' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    response.body.harvests.forEach((h: any) => {
      expect(h.name.toLowerCase()).toContain('especial');
    });
  });

  it('[GET] /harvests — deve filtrar apenas harvests ativos (active=true) (200)', async () => {
    const culture = await seedCulture(app, token, { name: 'Ativo Filter' });
    await seedHarvest(app, token, culture.id, { name: 'Ativo Sem EndDate' });

    const response = await request(app.getHttpServer())
      .get('/harvests')
      .query({ active: 'true' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.harvests).toBeInstanceOf(Array);
    response.body.harvests.forEach((h: any) => {
      expect(h.endDate).toBeUndefined();
    });
  });

  it('[GET] /harvests — deve retornar lista vazia sem harvests (200)', async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    token = await createAndAuthenticateUser(app);

    const response = await request(app.getHttpServer())
      .get('/harvests')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.harvests).toEqual([]);
    expect(response.body.pagination.meta.totalItems).toBe(0);
  });

  it('[GET] /harvests — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).get('/harvests');

    expect(response.status).toBe(401);
  });

  it('[GET] /harvests — deve rejeitar page=0 (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/harvests')
      .query({ page: 0 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('[GET] /harvests — deve rejeitar active com valor inválido (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/harvests')
      .query({ active: 'invalido' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

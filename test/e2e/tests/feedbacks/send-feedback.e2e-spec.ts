import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';

describe('Send Feedback Controller (e2e)', () => {
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

  it('[POST] /feedbacks — deve enviar feedback e retornar feedbackId (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
        description: 'Excelente aplicativo!',
        category: 'product_quality',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('feedbackId');
    expect(typeof response.body.feedbackId).toBe('string');
  });

  it('[POST] /feedbacks — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .send({
        rating: 3,
        description: 'Teste',
        category: 'delivery',
      });

    expect(response.status).toBe(401);
  });

  it('[POST] /feedbacks — deve rejeitar rating > 5 (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 6,
        description: 'Rating alto demais',
        category: 'service',
      });

    expect(response.status).toBe(400);
  });

  it('[POST] /feedbacks — deve rejeitar rating < 0 (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: -1,
        description: 'Rating negativo',
        category: 'price',
      });

    expect(response.status).toBe(400);
  });

  it('[POST] /feedbacks — deve rejeitar categoria inválida (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 3,
        description: 'Categoria errada',
        category: 'inexistente',
      });

    expect(response.status).toBe(400);
  });

  it('[POST] /feedbacks — deve rejeitar body vazio (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('[POST] /feedbacks — deve rejeitar rating decimal (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/feedbacks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 3.5,
        description: 'Rating decimal',
        category: 'other',
      });

    expect(response.status).toBe(400);
  });
});

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import createAndAuthenticateUser from '../../helpers/create-and-authenticate-user';

describe('Transactions — Caminho Triste (e2e)', () => {
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
  it('TC-008 | [GET] /transactions — deve rejeitar requisição sem token (401)', async () => {
    const response = await request(app.getHttpServer()).get('/transactions');
    expect(response.status).toBe(401);
  });
  it('TC-009 | [GET] /transactions — deve rejeitar page=0 (400)', async () => {
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .query({ page: 0 })
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(400);
    expect(response.body.message[0]).toBe('page must not be less than 1');
  });
  it('TC-010 | [PATCH] /transactions/:id - deve rejeitar ID de transição inexistente', async () => {
    const response = await request(app.getHttpServer())
      .patch('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Qualquer coisa' });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found');
  });
  it('TC-011 | [DELETE] /transactions/:id - deve rejeitar ID de transição inexistente ao deletar', async () => {
    const response = await request(app.getHttpServer())
      .delete('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Transaction not found');
  });
});

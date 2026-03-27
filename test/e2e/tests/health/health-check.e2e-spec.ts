import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';

describe('Health Check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[GET] /health-check/ - should return OK', async () => {
    const response = await request(app.getHttpServer()).get('/health-check');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

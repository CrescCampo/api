import { createHash } from 'node:crypto';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import {
  registerAndAuthenticate,
  AuthenticatedUser,
} from '../../factories/make-user';

function sha256(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

describe('Reset Password Controller (e2e)', () => {
  let app: INestApplication;
  let passwordResetTokenRepository: PasswordResetTokenRepository;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    passwordResetTokenRepository = app.get(PasswordResetTokenRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedToken(
    user: AuthenticatedUser,
    plainToken: string,
    overrides: Partial<{ expiresAt: Date; usedAt: Date }> = {},
  ) {
    const token = PasswordResetToken.create({
      farmerId: user.userId,
      tokenHash: sha256(plainToken),
      expiresAt: overrides.expiresAt,
      usedAt: overrides.usedAt,
    });
    await passwordResetTokenRepository.save(token);
  }

  it('[POST] /farmers/password/reset/confirm — deve redefinir a senha com token válido (204)', async () => {
    const user = await registerAndAuthenticate(app);
    const plainToken = 'valid-token-1';
    await seedToken(user, plainToken);

    const response = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: plainToken, newPassword: 'nova-senha-segura-123' });

    expect(response.status).toBe(204);

    // senha antiga não funciona mais
    const oldLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
    expect(oldLogin.status).toBe(401);

    // senha nova funciona
    const newLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'nova-senha-segura-123' });
    expect(newLogin.status).toBe(201);
    expect(newLogin.body).toHaveProperty('token');
  });

  it('[POST] /farmers/password/reset/confirm — deve rejeitar reuso do mesmo token (400)', async () => {
    const user = await registerAndAuthenticate(app);
    const plainToken = 'one-shot-token';
    await seedToken(user, plainToken);

    const first = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: plainToken, newPassword: 'primeira-senha-123' });
    expect(first.status).toBe(204);

    const second = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: plainToken, newPassword: 'segunda-senha-123' });
    expect(second.status).toBe(400);
  });

  it('[POST] /farmers/password/reset/confirm — deve rejeitar token inexistente (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: 'token-que-nao-existe', newPassword: 'qualquer-senha-1' });

    expect(response.status).toBe(400);
  });

  it('[POST] /farmers/password/reset/confirm — deve rejeitar token expirado (400)', async () => {
    const user = await registerAndAuthenticate(app);
    const plainToken = 'expired-token';
    await seedToken(user, plainToken, {
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: plainToken, newPassword: 'nova-senha-segura-123' });

    expect(response.status).toBe(400);
  });

  it('[POST] /farmers/password/reset/confirm — deve rejeitar senha curta (400)', async () => {
    const user = await registerAndAuthenticate(app);
    const plainToken = 'short-password-token';
    await seedToken(user, plainToken);

    const response = await request(app.getHttpServer())
      .post('/farmers/password/reset/confirm')
      .send({ token: plainToken, newPassword: '123' });

    expect(response.status).toBe(400);
  });
});

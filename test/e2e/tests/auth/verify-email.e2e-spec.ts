import { createHash } from 'node:crypto';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import VerificationEmailSender from 'domain/application/email/verification-email-sender';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import TestAppFactory from '../../helpers/test-app-factory';
import FakeVerificationEmailSender from '../../helpers/fake-verification-email-sender';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

function sha256(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

describe('Verify Email Controller (e2e)', () => {
  let app: INestApplication;
  let emailSender: FakeVerificationEmailSender;
  let farmerRepository: FarmerRepository;
  let emailVerificationCodeRepository: EmailVerificationCodeRepository;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
    emailSender = app.get(VerificationEmailSender);
    farmerRepository = app.get(FarmerRepository);
    emailVerificationCodeRepository = app.get(EmailVerificationCodeRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerUnverified() {
    const user = makeUser();
    await request(app.getHttpServer()).post('/auth/register').send(user);
    const code = emailSender.lastCodeFor(user.email);
    return { user, code };
  }

  it('[POST] /auth/verify-email — deve verificar com o código e retornar tokens (201)', async () => {
    const { user, code } = await registerUnverified();

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('farmId');

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
    expect(login.status).toBe(201);
  });

  it('[POST] /auth/verify-email — deve travar o código após 5 tentativas erradas (400)', async () => {
    const { user, code } = await registerUnverified();

    for (let attempt = 0; attempt < 5; attempt++) {
      const wrong = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ email: user.email, code: '000000' });
      expect(wrong.status).toBe(400);
    }

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code });

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/verify-email — deve rejeitar código expirado (400)', async () => {
    const user = makeUser();
    await request(app.getHttpServer()).post('/auth/register').send(user);
    const farmer = await farmerRepository.findByEmail(user.email);

    const expiredCode = EmailVerificationCode.create({
      farmerId: farmer!.id,
      codeHash: sha256('222222'),
      expiresAt: new Date(Date.now() - 60_000),
    });
    await emailVerificationCodeRepository.save(expiredCode);

    const response = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code: '222222' });

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/verify-email — deve rejeitar após reenvio invalidar o código anterior (400) e aceitar o novo (201)', async () => {
    const user = makeUser();
    await request(app.getHttpServer()).post('/auth/register').send(user);
    const farmer = await farmerRepository.findByEmail(user.email);

    const registerCode =
      await emailVerificationCodeRepository.findActiveByFarmerId(farmer!.id);
    registerCode!.invalidate();
    await emailVerificationCodeRepository.save(registerCode!);

    const oldCode = EmailVerificationCode.create({
      farmerId: farmer!.id,
      codeHash: sha256('333333'),
      createdAt: new Date(Date.now() - 2 * 60_000),
    });
    await emailVerificationCodeRepository.save(oldCode);

    const resend = await request(app.getHttpServer())
      .post('/auth/verify-email/resend')
      .send({ email: user.email });
    expect(resend.status).toBe(204);

    const withOld = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code: '333333' });
    expect(withOld.status).toBe(400);

    const newCode = emailSender.lastCodeFor(user.email);
    const withNew = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code: newCode });
    expect(withNew.status).toBe(201);
  });

  it('[POST] /auth/verify-email — deve rejeitar email já verificado (409)', async () => {
    const { user, code } = await registerUnverified();

    const first = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: user.email, code });
    expect(second.status).toBe(409);
  });

  it('[POST] /auth/verify-email/resend — deve responder 204 mesmo para email inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/verify-email/resend')
      .send({ email: 'nao-existe@exemplo.com' });

    expect(response.status).toBe(204);
  });
});

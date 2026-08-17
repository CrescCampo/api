import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import AppModule from 'infra/app.module';
import EmailIpThrottlerGuard from 'infra/auth/email-ip-throttler.guard';
import GoogleTokenVerifier, {
  GoogleUserInfo,
} from 'domain/application/gateways/google-token-verifier';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';
import registerUser from '../../helpers/register-user';
import seedInvite from '../../helpers/seed-invite';

class StubGoogleTokenVerifier implements GoogleTokenVerifier {
  next: GoogleUserInfo = {
    sub: 'google-sub-e2e',
    email: `google.${Date.now()}@example.com`,
    emailVerified: true,
    name: 'Google Farmer',
  };

  async verify(): Promise<GoogleUserInfo> {
    return this.next;
  }
}

describe('Google Auth Controller (e2e)', () => {
  let app: INestApplication;
  const verifier = new StubGoogleTokenVerifier();

  beforeAll(async () => {
    await cleanDatabase();

    const allowAll = { canActivate: () => true };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerGuard)
      .useValue(allowAll)
      .overrideGuard(EmailIpThrottlerGuard)
      .useValue(allowAll)
      .overrideProvider(GoogleTokenVerifier)
      .useValue(verifier)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /auth/google — deve provisionar uma conta nova no primeiro login (200)', async () => {
    verifier.next = {
      sub: 'sub-new',
      email: `new.${Date.now()}@example.com`,
      emailVerified: true,
      name: 'Novo Produtor',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'stub', inviteCode: await seedInvite() });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('farmId');
    expect(response.body.hasPassword).toBe(false);
  });

  it('[POST] /auth/google — deve vincular ao mesmo email cadastrado por senha', async () => {
    const user = makeUser({ name: 'Mesmo Email' });
    await registerUser(app, user);

    verifier.next = {
      sub: 'sub-linked',
      email: user.email,
      emailVerified: true,
      name: user.name,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'stub' });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(user.email);
    expect(response.body.hasPassword).toBe(true);

    const farmerRepository = app.get(FarmerRepository);
    const farmer = await farmerRepository.findByEmail(user.email);
    expect(farmer?.googleId).toBe('sub-linked');
  });

  it('[POST] /auth/google — deve rejeitar email não verificado (400)', async () => {
    verifier.next = {
      sub: 'sub-unverified',
      email: `unverified.${Date.now()}@example.com`,
      emailVerified: false,
      name: 'Sem Verificar',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'stub' });

    expect(response.status).toBe(400);
  });

  it('[POST] /auth/google — deve recusar primeiro login sem convite (403)', async () => {
    verifier.next = {
      sub: 'sub-sem-convite',
      email: `sem.convite.${Date.now()}@example.com`,
      emailVerified: true,
      name: 'Sem Convite',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: 'stub' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invite Required');
  });
});

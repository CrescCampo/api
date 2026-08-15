import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser, markEmailVerified } from '../../factories/make-user';
import registerUser from '../../helpers/register-user';
import seedInvite from '../../helpers/seed-invite';

const VALID_USER = makeUser({ name: 'Farmer Registro' });

describe('Register Farmer Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  it('[POST] /auth/register — deve registrar novo usuário e retornar userId (201)', async () => {
    const response = await registerUser(app, VALID_USER);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(typeof response.body.userId).toBe('string');
    expect(response.body.userId.length).toBeGreaterThan(0);
    expect(response.body).not.toHaveProperty('token');
  });

  it('[POST] /auth/register — deve criar culturas e categorias padrão ao registrar', async () => {
    const uniqueUser = {
      name: 'Farmer Defaults',
      email: `defaults.${Date.now()}@exemplo.com`,
      password: 'senha-segura-123',
    };

    await registerUser(app, uniqueUser);

    await markEmailVerified(app, uniqueUser.email);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueUser.email, password: uniqueUser.password });

    const { token } = loginRes.body;

    const pullRes = await request(app.getHttpServer())
      .get('/app/pull')
      .set('Authorization', `Bearer ${token}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.cultures.length).toBe(4);
    expect(pullRes.body.transactionCategories.length).toBe(6);
  });

  it('[POST] /auth/register — deve rejeitar email com formato inválido (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Qualquer Nome',
        email: 'isso-nao-e-um-email',
        password: 'qualquer-senha',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('[POST] /auth/register — deve rejeitar email já cadastrado (409)', async () => {
    const response = await registerUser(app, VALID_USER);

    expect(response.status).toBe(409);
  });

  it('[POST] /auth/register — deve rejeitar body vazio (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('name must be a string');
  });

  it('[POST] /auth/register — deve rejeitar body sem password (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Nome', email: 'valido@email.com' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it.each([
    {
      label: 'menor que 10 chars',
      password: 'curta1',
    },
    {
      label: 'sem letra',
      password: '1234567890',
    },
    {
      label: 'sem número ou símbolo',
      password: 'abcdefghijk',
    },
  ])(
    '[POST] /auth/register — deve rejeitar senha fraca: $label (400)',
    async ({ password }) => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Senha Fraca',
          email: `weak.${Date.now()}.${Math.random()}@exemplo.com`,
          password,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    },
  );

  it('[POST] /auth/register — deve recusar cadastro sem convite (403)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(makeUser({ name: 'Sem Convite' }));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invite Required');
  });

  it('[POST] /auth/register — deve recusar convite inexistente (403)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...makeUser({ name: 'Convite Ruim' }),
        inviteCode: 'CRESC-ZZZZ',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invalid Invite');
  });

  it('[POST] /auth/register — deve recusar convite já esgotado (403)', async () => {
    const inviteCode = await seedInvite();

    const first = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...makeUser({ name: 'Primeiro Uso' }), inviteCode });
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...makeUser({ name: 'Segundo Uso' }), inviteCode });

    expect(second.status).toBe(403);
    expect(second.body.error).toBe('Invalid Invite');
  });

  it('[POST] /auth/register — deve aceitar convite de multiplos usos ate esgotar', async () => {
    const inviteCode = await seedInvite(2);

    for (let i = 0; i < 2; i += 1) {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...makeUser({ name: `Coop ${i}` }), inviteCode });
      expect(res.status).toBe(201);
    }

    const exceeded = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...makeUser({ name: 'Coop Extra' }), inviteCode });

    expect(exceeded.status).toBe(403);
  });
});

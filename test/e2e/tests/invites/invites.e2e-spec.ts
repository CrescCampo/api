import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

const ADMIN_KEY = process.env.ADMIN_API_KEY as string;
const CODE_PATTERN = /^CRESC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

describe('Invites Controllers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createInvite(body: Record<string, unknown> = {}) {
    return request(app.getHttpServer())
      .post('/invites')
      .set('x-admin-key', ADMIN_KEY)
      .send(body);
  }

  it('[POST] /invites — deve recusar requisição sem a chave administrativa (401)', async () => {
    const response = await request(app.getHttpServer())
      .post('/invites')
      .send({});

    expect(response.status).toBe(401);
  });

  it('[GET] /invites — deve recusar requisição sem a chave administrativa (401)', async () => {
    const response = await request(app.getHttpServer()).get('/invites');

    expect(response.status).toBe(401);
  });

  it.each([
    {
      label: 'chave errada do mesmo tamanho',
      key: ADMIN_KEY.replace(/.$/, 'x'),
    },
    { label: 'chave errada de tamanho diferente', key: 'curta' },
    { label: 'chave vazia', key: '' },
  ])('[GET] /invites — deve recusar $label (401)', async ({ key }) => {
    const response = await request(app.getHttpServer())
      .get('/invites')
      .set('x-admin-key', key);

    expect(response.status).toBe(401);
  });

  it('[POST] /invites — deve criar convite com os padrões e devolver código CRESC-XXXX (201)', async () => {
    const response = await createInvite({
      note: 'Marcos - produtor de morango',
    });

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(CODE_PATTERN);
    expect(response.body.id).toBeTruthy();
  });

  it('[POST] /invites — deve criar código de cooperativa com maxUses e expiresAt (201)', async () => {
    const response = await createInvite({
      maxUses: 50,
      note: 'Cooperativa X',
      expiresAt: '2027-12-31T00:00:00.000Z',
    });

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(CODE_PATTERN);
  });

  it('[POST] /invites — deve rejeitar maxUses menor que 1 (400)', async () => {
    const response = await createInvite({ maxUses: 0 });

    expect(response.status).toBe(400);
  });

  it('[POST] /invites — deve rejeitar expiresAt no passado (400)', async () => {
    const response = await createInvite({
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid Invite Settings');
  });

  it('[GET] /invites — deve listar uso, limite, expiração e estado derivado (200)', async () => {
    const created = await createInvite({ maxUses: 3, note: 'Listagem' });

    const response = await request(app.getHttpServer())
      .get('/invites')
      .set('x-admin-key', ADMIN_KEY);

    expect(response.status).toBe(200);

    const invite = response.body.invites.find(
      (item: { code: string }) => item.code === created.body.code,
    );

    expect(invite).toMatchObject({
      usedCount: 0,
      maxUses: 3,
      expiresAt: null,
      remainingUses: 3,
      note: 'Listagem',
      isUsable: true,
      isExpired: false,
      isExhausted: false,
      isRevoked: false,
    });
  });

  it('[GET] /invites — deve ordenar por createdAt decrescente', async () => {
    const response = await request(app.getHttpServer())
      .get('/invites')
      .set('x-admin-key', ADMIN_KEY);

    const timestamps = response.body.invites.map(
      (item: { createdAt: string }) => new Date(item.createdAt).getTime(),
    );

    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });

  it('[POST] /invites/:code/revoke — deve revogar e carimbar revokedAt sem apagar (200)', async () => {
    const created = await createInvite({ note: 'Para revogar' });

    const response = await request(app.getHttpServer())
      .post(`/invites/${created.body.code}/revoke`)
      .set('x-admin-key', ADMIN_KEY);

    expect(response.status).toBe(200);
    expect(response.body.code).toBe(created.body.code);
    expect(response.body.revokedAt).toBeTruthy();

    const list = await request(app.getHttpServer())
      .get('/invites')
      .set('x-admin-key', ADMIN_KEY);

    const invite = list.body.invites.find(
      (item: { code: string }) => item.code === created.body.code,
    );

    expect(invite).toMatchObject({ isRevoked: true, isUsable: false });
    expect(invite.note).toBe('Para revogar');
  });

  it('[POST] /invites/:code/revoke — deve ser idempotente', async () => {
    const created = await createInvite();

    const first = await request(app.getHttpServer())
      .post(`/invites/${created.body.code}/revoke`)
      .set('x-admin-key', ADMIN_KEY);

    const second = await request(app.getHttpServer())
      .post(`/invites/${created.body.code}/revoke`)
      .set('x-admin-key', ADMIN_KEY);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.revokedAt).toBe(first.body.revokedAt);
  });

  it('[POST] /invites/:code/revoke — deve recusar convite inexistente (403)', async () => {
    const response = await request(app.getHttpServer())
      .post('/invites/CRESC-ZZZZ/revoke')
      .set('x-admin-key', ADMIN_KEY);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invalid Invite');
  });

  it('[POST] /auth/register — convite revogado deixa de funcionar no cadastro (403)', async () => {
    const created = await createInvite();
    const inviteCode = created.body.code;

    await request(app.getHttpServer())
      .post(`/invites/${inviteCode}/revoke`)
      .set('x-admin-key', ADMIN_KEY);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...makeUser({ name: 'Convite Revogado' }), inviteCode });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invalid Invite');
  });

  it('[POST] /auth/register — convite criado pelo endpoint funciona no cadastro (201)', async () => {
    const created = await createInvite();

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...makeUser({ name: 'Convite Valido' }),
        inviteCode: created.body.code,
      });

    expect(response.status).toBe(201);

    const list = await request(app.getHttpServer())
      .get('/invites')
      .set('x-admin-key', ADMIN_KEY);

    const invite = list.body.invites.find(
      (item: { code: string }) => item.code === created.body.code,
    );

    expect(invite).toMatchObject({
      usedCount: 1,
      remainingUses: 0,
      isExhausted: true,
      isUsable: false,
    });
  });
});

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import Invite from 'domain/enterprise/entities/Invite';
import TestAppFactory from '../../helpers/test-app-factory';
import { cleanDatabase } from '../../setup/clean-database';
import { makeUser } from '../../factories/make-user';

const ADMIN_KEY = process.env.ADMIN_API_KEY as string;
const CODE_PATTERN = /^CRESC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

const REJECTED_KEYS = [
  { label: 'sem header', key: undefined },
  { label: 'chave errada do mesmo tamanho', key: ADMIN_KEY.replace(/.$/, 'x') },
  { label: 'chave errada de tamanho diferente', key: 'curta' },
  { label: 'chave vazia', key: '' },
];

describe('Invites Controllers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();
    app = await TestAppFactory.create();
  });

  afterAll(async () => {
    await app.close();
  });

  function route(method: 'post' | 'get', path: string, key?: string) {
    const req = request(app.getHttpServer())[method](path);

    return key === undefined ? req : req.set('x-admin-key', key);
  }

  async function createInvite(body: Record<string, unknown> = {}) {
    const response = await route('post', '/invites', ADMIN_KEY).send(body);

    expect(response.status).toBe(201);
    expect(response.body.code).toMatch(CODE_PATTERN);

    return response.body as { id: string; code: string };
  }

  describe('guarda de chave administrativa', () => {
    const routes: Array<{
      label: string;
      method: 'post' | 'get';
      path: string;
    }> = [
      { label: 'POST /invites', method: 'post', path: '/invites' },
      { label: 'GET /invites', method: 'get', path: '/invites' },
      {
        label: 'POST /invites/:code/revoke',
        method: 'post',
        path: '/invites/CRESC-4F2K/revoke',
      },
    ];

    routes.forEach(({ label: routeLabel, method, path }) => {
      it.each(REJECTED_KEYS)(
        `${routeLabel} deve recusar $label (401)`,
        async ({ key }) => {
          const response = await route(method, path, key).send({});

          expect(response.status).toBe(401);
        },
      );
    });
  });

  describe('POST /invites', () => {
    it('deve criar convite com os padrões e devolver código CRESC-XXXX (201)', async () => {
      const created = await createInvite({
        note: 'Marcos - produtor de morango',
      });

      expect(created.id).toBeTruthy();
    });

    it('deve criar código de cooperativa com maxUses e expiresAt (201)', async () => {
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await createInvite({
        maxUses: 50,
        note: 'Cooperativa X',
        expiresAt: expiresAt.toISOString(),
      });
    });

    it('deve rejeitar maxUses menor que 1 (400)', async () => {
      const response = await route('post', '/invites', ADMIN_KEY).send({
        maxUses: 0,
      });

      expect(response.status).toBe(400);
    });

    it('deve rejeitar maxUses acima do que o int4 aguenta (400)', async () => {
      const response = await route('post', '/invites', ADMIN_KEY).send({
        maxUses: 3_000_000_000,
      });

      expect(response.status).toBe(400);
    });

    it('deve rejeitar expiresAt no passado (400)', async () => {
      const response = await route('post', '/invites', ADMIN_KEY).send({
        expiresAt: '2020-01-01T00:00:00.000Z',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid Invite Settings');
    });

    it('deve reamostrar quando o codigo sorteado ja existe no banco (201)', async () => {
      const existing = await createInvite({ note: 'Dono do codigo' });
      const freshCode = Invite.generateCode();

      const generateCode = vi
        .spyOn(Invite, 'generateCode')
        .mockReturnValueOnce(existing.code)
        .mockReturnValueOnce(freshCode);

      try {
        const response = await route('post', '/invites', ADMIN_KEY).send({
          note: 'Reamostrado',
        });

        expect(response.status).toBe(201);
        expect(response.body.code).toBe(freshCode);
        expect(generateCode).toHaveBeenCalledTimes(2);
      } finally {
        generateCode.mockRestore();
      }
    });

    it('deve estourar 503 quando toda tentativa de codigo colide (503)', async () => {
      const existing = await createInvite({ note: 'Dono do codigo unico' });

      const generateCode = vi
        .spyOn(Invite, 'generateCode')
        .mockReturnValue(existing.code);

      try {
        const response = await route('post', '/invites', ADMIN_KEY).send({
          note: 'Colisao total',
        });

        expect(response.status).toBe(503);
        expect(response.body.error).toBe('Invite Code Generation');
      } finally {
        generateCode.mockRestore();
      }
    });

    it.each(['20261231', '2026-366', '2026-W01-1'])(
      'deve rejeitar expiresAt em ISO básico que o Date não parseia: %s (400)',
      async expiresAt => {
        const response = await route('post', '/invites', ADMIN_KEY).send({
          expiresAt,
        });

        expect(response.status).toBe(400);
      },
    );
  });

  describe('GET /invites', () => {
    it('deve listar uso, limite, expiração e estado derivado (200)', async () => {
      const created = await createInvite({ maxUses: 3, note: 'Listagem' });

      const response = await route('get', '/invites', ADMIN_KEY);

      expect(response.status).toBe(200);

      const invite = response.body.invites.find(
        (item: { code: string }) => item.code === created.code,
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

    it('deve ordenar por createdAt decrescente', async () => {
      const response = await route('get', '/invites', ADMIN_KEY);

      expect(response.status).toBe(200);

      const timestamps = response.body.invites.map(
        (item: { createdAt: string }) => new Date(item.createdAt).getTime(),
      );

      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    });

    it('deve paginar e devolver o total (200)', async () => {
      await createInvite({ note: 'Paginacao A' });
      await createInvite({ note: 'Paginacao B' });

      const firstPage = await route(
        'get',
        '/invites?page=1&pageSize=1',
        ADMIN_KEY,
      );
      const secondPage = await route(
        'get',
        '/invites?page=2&pageSize=1',
        ADMIN_KEY,
      );

      expect(firstPage.status).toBe(200);
      expect(secondPage.status).toBe(200);
      expect(firstPage.body.invites).toHaveLength(1);
      expect(secondPage.body.invites).toHaveLength(1);
      expect(firstPage.body.invites[0].code).not.toBe(
        secondPage.body.invites[0].code,
      );
      expect(firstPage.body.pagination.meta.totalItems).toBeGreaterThan(1);
      expect(firstPage.body.pagination.meta).toMatchObject({
        currentPage: 1,
        items: 1,
      });
    });

    it('deve rejeitar pageSize acima do teto (400)', async () => {
      const response = await route('get', '/invites?pageSize=5000', ADMIN_KEY);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /invites/:code/revoke', () => {
    it('deve revogar e carimbar revokedAt sem apagar (200)', async () => {
      const created = await createInvite({ note: 'Para revogar' });

      const response = await route(
        'post',
        `/invites/${created.code}/revoke`,
        ADMIN_KEY,
      );

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(created.code);
      expect(response.body.revokedAt).toBeTruthy();

      const list = await route('get', '/invites', ADMIN_KEY);

      expect(list.status).toBe(200);

      const invite = list.body.invites.find(
        (item: { code: string }) => item.code === created.code,
      );

      expect(invite).toMatchObject({ isRevoked: true, isUsable: false });
      expect(invite.note).toBe('Para revogar');
    });

    it('deve ser idempotente', async () => {
      const created = await createInvite();

      const first = await route(
        'post',
        `/invites/${created.code}/revoke`,
        ADMIN_KEY,
      );
      const second = await route(
        'post',
        `/invites/${created.code}/revoke`,
        ADMIN_KEY,
      );

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.revokedAt).toBe(first.body.revokedAt);
    });

    it('deve aceitar o código em minúscula', async () => {
      const created = await createInvite();

      const response = await route(
        'post',
        `/invites/${created.code.toLowerCase()}/revoke`,
        ADMIN_KEY,
      );

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(created.code);
    });

    it('deve devolver 404 para convite inexistente', async () => {
      const response = await route(
        'post',
        '/invites/CRESC-ZZZZ/revoke',
        ADMIN_KEY,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invite Not Found');
    });
  });

  describe('efeito no cadastro', () => {
    it('convite revogado deixa de funcionar no cadastro (403)', async () => {
      const created = await createInvite();

      const revoked = await route(
        'post',
        `/invites/${created.code}/revoke`,
        ADMIN_KEY,
      );

      expect(revoked.status).toBe(200);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...makeUser({ name: 'Convite Revogado' }),
          inviteCode: created.code,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid Invite');
    });

    it('convite criado pelo endpoint funciona no cadastro (201)', async () => {
      const created = await createInvite();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...makeUser({ name: 'Convite Valido' }),
          inviteCode: created.code,
        });

      expect(response.status).toBe(201);

      const list = await route('get', '/invites', ADMIN_KEY);

      expect(list.status).toBe(200);

      const invite = list.body.invites.find(
        (item: { code: string }) => item.code === created.code,
      );

      expect(invite).toMatchObject({
        usedCount: 1,
        remainingUses: 0,
        isExhausted: true,
        isUsable: false,
      });
    });
  });
});

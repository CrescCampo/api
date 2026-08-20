import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ListInvites, {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from 'domain/application/use-cases/invites/list-invites';
import Invite from 'domain/enterprise/entities/Invite';
import InMemoryInviteRepository from '../../repositories/InMemoryInviteRepository';

describe('ListInvites', () => {
  let sut: ListInvites;
  let inviteRepository: InMemoryInviteRepository;

  beforeEach(() => {
    inviteRepository = new InMemoryInviteRepository();
    sut = new ListInvites(inviteRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devolve lista vazia quando não há convites', async () => {
    const { invites, pagination } = await sut.execute();

    expect(invites).toEqual([]);
    expect(pagination.meta).toEqual({
      currentPage: 1,
      items: 0,
      totalItems: 0,
    });
  });

  it('devolve primitivos com os campos derivados resolvidos', async () => {
    await inviteRepository.save(
      Invite.create({
        code: 'CRESC-AAAA',
        maxUses: 3,
        usedCount: 1,
        note: 'Marcos',
      }),
    );

    const { invites } = await sut.execute();

    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject({
      code: 'CRESC-AAAA',
      maxUses: 3,
      usedCount: 1,
      remainingUses: 2,
      note: 'Marcos',
      isUsable: true,
      isExpired: false,
      isExhausted: false,
      isRevoked: false,
    });
    expect(invites[0]).not.toBeInstanceOf(Invite);
  });

  it('deriva esgotado, expirado e revogado', async () => {
    await inviteRepository.save(
      Invite.create({ code: 'CRESC-AAAA', maxUses: 1, usedCount: 1 }),
    );
    await inviteRepository.save(
      Invite.create({
        code: 'CRESC-BBBB',
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );
    await inviteRepository.save(
      Invite.create({ code: 'CRESC-CCCC', revokedAt: new Date() }),
    );

    const { invites } = await sut.execute();

    const byCode = Object.fromEntries(
      invites.map(invite => [invite.code, invite]),
    );

    expect(byCode['CRESC-AAAA']).toMatchObject({
      isExhausted: true,
      isUsable: false,
    });
    expect(byCode['CRESC-BBBB']).toMatchObject({
      isExpired: true,
      isUsable: false,
    });
    expect(byCode['CRESC-CCCC']).toMatchObject({
      isRevoked: true,
      isUsable: false,
    });
  });

  it('preserva a ordem createdAt decrescente que o repositório entrega', async () => {
    await inviteRepository.save(
      Invite.create({
        code: 'CRESC-AAAA',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
    );
    await inviteRepository.save(
      Invite.create({
        code: 'CRESC-CCCC',
        createdAt: new Date('2026-03-01T00:00:00Z'),
      }),
    );
    await inviteRepository.save(
      Invite.create({
        code: 'CRESC-BBBB',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      }),
    );

    const { invites } = await sut.execute();

    expect(invites.map(invite => invite.code)).toEqual([
      'CRESC-CCCC',
      'CRESC-BBBB',
      'CRESC-AAAA',
    ]);
  });

  it('não reordena nem muta o array que o repositório devolve', async () => {
    const fromRepository = [
      Invite.create({
        code: 'CRESC-BBBB',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      }),
      Invite.create({
        code: 'CRESC-AAAA',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
    ];

    vi.spyOn(inviteRepository, 'listPaginated').mockResolvedValue(
      fromRepository,
    );

    const { invites } = await sut.execute();

    expect(fromRepository.map(invite => invite.code)).toEqual([
      'CRESC-BBBB',
      'CRESC-AAAA',
    ]);
    expect(invites.map(invite => invite.code)).toEqual([
      'CRESC-BBBB',
      'CRESC-AAAA',
    ]);
  });

  it('pagina e devolve o total independente da página', async () => {
    for (let index = 0; index < 5; index += 1) {
      const code = `CRESC-000${index}`;

      await inviteRepository.save(
        Invite.create({
          code,
          createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        }),
      );
    }

    const firstPage = await sut.execute({ page: 1, pageSize: 2 });
    const lastPage = await sut.execute({ page: 3, pageSize: 2 });

    expect(firstPage.invites).toHaveLength(2);
    expect(firstPage.pagination.meta).toEqual({
      currentPage: 1,
      items: 2,
      totalItems: 5,
    });
    expect(lastPage.invites).toHaveLength(1);
    expect(lastPage.pagination.meta).toEqual({
      currentPage: 3,
      items: 1,
      totalItems: 5,
    });
    expect(firstPage.invites[0].code).not.toBe(lastPage.invites[0].code);
  });

  it('limita o pageSize pedido ao repositório', async () => {
    const listPaginated = vi.spyOn(inviteRepository, 'listPaginated');

    await sut.execute({ pageSize: 5_000 });

    expect(listPaginated).toHaveBeenCalledWith(MAX_PAGE_SIZE, 0);
  });

  it.each([
    { label: 'sem parâmetros', input: {}, limit: DEFAULT_PAGE_SIZE, offset: 0 },
    {
      label: 'pageSize zero cai no padrão',
      input: { pageSize: 0 },
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
    },
    {
      label: 'página negativa cai na primeira',
      input: { page: -3, pageSize: 5 },
      limit: 5,
      offset: 0,
    },
    {
      label: 'offset acompanha a página',
      input: { page: 4, pageSize: 25 },
      limit: 25,
      offset: 75,
    },
  ])('traduz $label em limit e offset', async ({ input, limit, offset }) => {
    const listPaginated = vi.spyOn(inviteRepository, 'listPaginated');

    await sut.execute(input);

    expect(listPaginated).toHaveBeenCalledWith(limit, offset);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import ListInvites from 'domain/application/use-cases/invites/list-invites';
import Invite from 'domain/enterprise/entities/Invite';
import InMemoryInviteRepository from '../../repositories/InMemoryInviteRepository';

describe('ListInvites', () => {
  let sut: ListInvites;
  let inviteRepository: InMemoryInviteRepository;

  beforeEach(() => {
    inviteRepository = new InMemoryInviteRepository();
    sut = new ListInvites(inviteRepository);
  });

  it('devolve lista vazia quando não há convites', async () => {
    const { invites } = await sut.execute();

    expect(invites).toEqual([]);
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

  it('ordena por createdAt decrescente', async () => {
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
});

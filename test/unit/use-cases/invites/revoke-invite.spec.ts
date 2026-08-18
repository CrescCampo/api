import { describe, it, expect, beforeEach, vi } from 'vitest';
import RevokeInvite from 'domain/application/use-cases/invites/revoke-invite';
import InviteNotFoundError from 'domain/application/errors/invite/InviteNotFoundError';
import Invite from 'domain/enterprise/entities/Invite';
import InMemoryInviteRepository from '../../repositories/InMemoryInviteRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

describe('RevokeInvite', () => {
  let sut: RevokeInvite;
  let inviteRepository: InMemoryInviteRepository;
  let unitOfWork: InMemoryUnitOfWork;

  beforeEach(() => {
    inviteRepository = new InMemoryInviteRepository();
    unitOfWork = new InMemoryUnitOfWork();
    sut = new RevokeInvite(inviteRepository, unitOfWork);
  });

  it('revoga um convite existente', async () => {
    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));

    const result = await sut.execute({ code: 'CRESC-AAAA' });

    expect(result.code).toBe('CRESC-AAAA');
    expect(result.revokedAt).toBeInstanceOf(Date);
    expect(inviteRepository.items[0].isRevoked).toBe(true);
    expect(inviteRepository.items[0].isUsable).toBe(false);
    expect(unitOfWork.commitCount).toBe(1);
  });

  it('normaliza o código recebido', async () => {
    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));

    const result = await sut.execute({ code: '  cresc-aaaa  ' });

    expect(result.code).toBe('CRESC-AAAA');
    expect(inviteRepository.items[0].isRevoked).toBe(true);
  });

  it('não apaga o convite ao revogar', async () => {
    await inviteRepository.save(
      Invite.create({ code: 'CRESC-AAAA', maxUses: 5, usedCount: 2 }),
    );

    await sut.execute({ code: 'CRESC-AAAA' });

    expect(inviteRepository.items).toHaveLength(1);
    expect(inviteRepository.items[0].usedCount).toBe(2);
  });

  it('é idempotente: revogar duas vezes não é erro', async () => {
    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));

    const first = await sut.execute({ code: 'CRESC-AAAA' });
    const second = await sut.execute({ code: 'CRESC-AAAA' });

    expect(second.revokedAt).toEqual(first.revokedAt);
    expect(inviteRepository.items).toHaveLength(1);
  });

  it('não regrava quando o convite já estava revogado', async () => {
    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));
    await sut.execute({ code: 'CRESC-AAAA' });

    const saveSpy = vi.spyOn(inviteRepository, 'save');

    await sut.execute({ code: 'CRESC-AAAA' });

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('estoura InviteNotFoundError quando o convite não existe', async () => {
    await expect(sut.execute({ code: 'CRESC-ZZZZ' })).rejects.toThrow(
      InviteNotFoundError,
    );
    expect(unitOfWork.rollbackCount).toBe(1);
  });
});

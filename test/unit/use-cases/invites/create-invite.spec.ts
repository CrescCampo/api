import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import CreateInvite, {
  MAX_USES_LIMIT,
} from 'domain/application/use-cases/invites/create-invite';
import InvalidInviteSettingsError from 'domain/application/errors/invite/InvalidInviteSettingsError';
import InviteCodeGenerationError from 'domain/application/errors/invite/InviteCodeGenerationError';
import Invite from 'domain/enterprise/entities/Invite';
import InMemoryInviteRepository from '../../repositories/InMemoryInviteRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

describe('CreateInvite', () => {
  let sut: CreateInvite;
  let inviteRepository: InMemoryInviteRepository;
  let unitOfWork: InMemoryUnitOfWork;

  beforeEach(() => {
    inviteRepository = new InMemoryInviteRepository();
    unitOfWork = new InMemoryUnitOfWork();
    sut = new CreateInvite(inviteRepository, unitOfWork);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cria um convite com os padrões e devolve id e código', async () => {
    const result = await sut.execute({});

    expect(result.id).toBeTruthy();
    expect(result.code).toMatch(/^CRESC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(inviteRepository.items).toHaveLength(1);
    expect(inviteRepository.items[0].maxUses).toBe(1);
    expect(inviteRepository.items[0].usedCount).toBe(0);
    expect(inviteRepository.items[0].expiresAt).toBeNull();
    expect(inviteRepository.items[0].note).toBeNull();
    expect(unitOfWork.commitCount).toBe(1);
  });

  it('persiste maxUses, expiresAt e note quando informados', async () => {
    const expiresAt = new Date(Date.now() + 86_400_000);

    await sut.execute({ maxUses: 50, expiresAt, note: 'Cooperativa X' });

    const [invite] = inviteRepository.items;

    expect(invite.maxUses).toBe(50);
    expect(invite.expiresAt).toEqual(expiresAt);
    expect(invite.note).toBe('Cooperativa X');
  });

  it('grava o convite dentro da transação', async () => {
    let itemsDuringTransaction = -1;

    const originalRun = unitOfWork.run.bind(unitOfWork);
    vi.spyOn(unitOfWork, 'run').mockImplementation(async fn =>
      originalRun(async () => {
        const result = await fn();
        itemsDuringTransaction = inviteRepository.items.length;
        return result;
      }),
    );

    await sut.execute({});

    expect(itemsDuringTransaction).toBe(1);
  });

  it.each([0, -1, 1.5])('rejeita maxUses inválido: %s', async maxUses => {
    await expect(sut.execute({ maxUses })).rejects.toThrow(
      InvalidInviteSettingsError,
    );
    expect(inviteRepository.items).toHaveLength(0);
  });

  it('rejeita maxUses acima do teto', async () => {
    await expect(sut.execute({ maxUses: MAX_USES_LIMIT + 1 })).rejects.toThrow(
      InvalidInviteSettingsError,
    );
    expect(inviteRepository.items).toHaveLength(0);
  });

  it('aceita maxUses exatamente no teto', async () => {
    await sut.execute({ maxUses: MAX_USES_LIMIT });

    expect(inviteRepository.items[0].maxUses).toBe(MAX_USES_LIMIT);
  });

  it('rejeita expiresAt no passado', async () => {
    const expiresAt = new Date(Date.now() - 1_000);

    await expect(sut.execute({ expiresAt })).rejects.toThrow(
      InvalidInviteSettingsError,
    );
    expect(inviteRepository.items).toHaveLength(0);
  });

  it('rejeita expiresAt que não é data válida', async () => {
    await expect(
      sut.execute({ expiresAt: new Date('20261231') }),
    ).rejects.toThrow(InvalidInviteSettingsError);
    expect(inviteRepository.items).toHaveLength(0);
  });

  it('reamostra o código quando o repositório recusa a colisão', async () => {
    const generateCode = vi
      .spyOn(Invite, 'generateCode')
      .mockReturnValueOnce('CRESC-AAAA')
      .mockReturnValueOnce('CRESC-BBBB');

    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));

    const result = await sut.execute({});

    expect(result.code).toBe('CRESC-BBBB');
    expect(generateCode).toHaveBeenCalledTimes(2);
    expect(inviteRepository.items).toHaveLength(2);
  });

  it('estoura quando o teto de tentativas de código é atingido', async () => {
    vi.spyOn(Invite, 'generateCode').mockReturnValue('CRESC-AAAA');

    await inviteRepository.save(Invite.create({ code: 'CRESC-AAAA' }));

    await expect(sut.execute({})).rejects.toThrow(InviteCodeGenerationError);
    expect(inviteRepository.items).toHaveLength(1);
  });

  it('propaga erro de persistência que não seja colisão de código', async () => {
    vi.spyOn(inviteRepository, 'save').mockRejectedValue(
      new Error('connection lost'),
    );

    await expect(sut.execute({})).rejects.toThrow('connection lost');
  });
});

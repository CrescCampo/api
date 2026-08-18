import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import InviteRequiredError from 'domain/application/errors/invite/InviteRequiredError';
import InvalidInviteError from 'domain/application/errors/invite/InvalidInviteError';
import FarmAccessStatus from 'domain/enterprise/enums/FarmAccessStatus';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Invite from 'domain/enterprise/entities/Invite';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import VerificationEmailSender, {
  SendVerificationEmailInput,
} from 'domain/application/email/verification-email-sender';
import AccountCreatedNotifier, {
  AccountCreatedNotification,
} from 'domain/application/notifications/account-created-notifier';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import InMemoryFarmRepository from '../../repositories/InMemoryFarmRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryCultureRepository from '../../repositories/InMemoryCultureRepository';
import InMemoryTransactionCategoryRepository from '../../repositories/InMemoryTransactionCategoryRepository';
import InMemoryInviteRepository from '../../repositories/InMemoryInviteRepository';
import InMemoryEmailVerificationCodeRepository from '../../repositories/InMemoryEmailVerificationCodeRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';
import NoopTracer from '../../tracing/NoopTracer';

class FakeAccountCreatedNotifier implements AccountCreatedNotifier {
  notifications: AccountCreatedNotification[] = [];

  shouldFail = false;

  async notifyAccountCreated(input: AccountCreatedNotification): Promise<void> {
    this.notifications.push(input);

    if (this.shouldFail) {
      throw new Error('Discord is down');
    }
  }
}

class FakeOtpGenerator implements OtpGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    return { plain: '123456', hash: this.hash('123456') };
  }

  hash(plain: string): string {
    return `hashed-${plain}`;
  }
}

class FakeVerificationEmailSender implements VerificationEmailSender {
  calls: SendVerificationEmailInput[] = [];

  shouldFail = false;

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    this.calls.push(input);

    if (this.shouldFail) {
      throw new Error('Resend is down');
    }
  }
}

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryFarmRepository: InMemoryFarmRepository;
let inMemoryCultureRepository: InMemoryCultureRepository;
let inMemoryTransactionCategoryRepository: InMemoryTransactionCategoryRepository;
let inMemoryInviteRepository: InMemoryInviteRepository;
let inMemoryEmailVerificationCodeRepository: InMemoryEmailVerificationCodeRepository;
let hashGenerator: HashGenerator;
let otpGenerator: FakeOtpGenerator;
let verificationEmailSender: FakeVerificationEmailSender;
let unitOfWork: InMemoryUnitOfWork;
let tracer: NoopTracer;
let accountCreatedNotifier: FakeAccountCreatedNotifier;
let sut: RegisterUserUseCase;

class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

const INVITE_CODE = 'CRESC-4F2K';

describe('RegisterUserUseCase', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryFarmRepository = new InMemoryFarmRepository();
    inMemoryCultureRepository = new InMemoryCultureRepository();
    inMemoryTransactionCategoryRepository =
      new InMemoryTransactionCategoryRepository();
    inMemoryInviteRepository = new InMemoryInviteRepository();
    inMemoryInviteRepository.items.push(
      Invite.create({ code: INVITE_CODE, maxUses: 10 }),
    );
    inMemoryEmailVerificationCodeRepository =
      new InMemoryEmailVerificationCodeRepository();
    hashGenerator = new FakeHashGenerator();
    otpGenerator = new FakeOtpGenerator();
    verificationEmailSender = new FakeVerificationEmailSender();
    unitOfWork = new InMemoryUnitOfWork();
    tracer = new NoopTracer();
    accountCreatedNotifier = new FakeAccountCreatedNotifier();

    const farmerProvisioner = new FarmerProvisioner(
      inMemoryFarmerRepository,
      inMemoryFarmRepository,
      inMemoryInviteRepository,
      inMemoryCultureRepository,
      inMemoryTransactionCategoryRepository,
    );

    sut = new RegisterUserUseCase(
      inMemoryFarmerRepository,
      farmerProvisioner,
      hashGenerator,
      otpGenerator,
      inMemoryEmailVerificationCodeRepository,
      verificationEmailSender,
      unitOfWork,
      tracer,
      accountCreatedNotifier,
    );
  });

  it('should throw error if user already exists', async () => {
    const farm = Farm.create({});
    const existingUser = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-password',
    });

    await inMemoryFarmerRepository.save(existingUser);

    await expect(
      sut.execute({
        name: 'Maria Clara',
        email: 'maria@example.com',
        password: 'password',
        inviteCode: INVITE_CODE,
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('should create a user linked to a new farm', async () => {
    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(inMemoryFarmRepository.items).toHaveLength(1);
    expect(inMemoryFarmerRepository.items).toHaveLength(1);
    expect(inMemoryFarmerRepository.items[0].id).toBe(result.userId);
    expect(inMemoryFarmerRepository.items[0].name).toBe('Joao Paulo');
    expect(inMemoryFarmerRepository.items[0].email).toBe('joao@example.com');
    expect(inMemoryFarmerRepository.items[0].password).toBe('hashed-secret');
    expect(inMemoryFarmerRepository.items[0].farmId).toBe(
      inMemoryFarmRepository.items[0].id,
    );
  });

  it('should create the farmer with an unverified email', async () => {
    await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(inMemoryFarmerRepository.items[0].emailVerified).toBe(false);
  });

  it('should persist a verification code and send it by email', async () => {
    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(inMemoryEmailVerificationCodeRepository.items).toHaveLength(1);
    const stored = inMemoryEmailVerificationCodeRepository.items[0];
    expect(stored.farmerId).toBe(result.userId);
    expect(stored.codeHash).toBe('hashed-123456');
    expect(stored.usedAt).toBeNull();

    expect(verificationEmailSender.calls).toEqual([
      { to: 'joao@example.com', name: 'Joao', code: '123456' },
    ]);
  });

  it('should still create the account when the verification email fails', async () => {
    verificationEmailSender.shouldFail = true;

    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(result.userId).toBeTruthy();
    expect(inMemoryFarmerRepository.items).toHaveLength(1);
    expect(inMemoryEmailVerificationCodeRepository.items).toHaveLength(1);
  });

  it('should create default cultures for the new farm', async () => {
    await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    const farmId = inMemoryFarmRepository.items[0].id;
    const cultures = await inMemoryCultureRepository.findByFarmId(farmId);

    expect(cultures).toHaveLength(4);
    expect(cultures.map(c => c.name)).toEqual(
      expect.arrayContaining(['Morango', 'Mandioca', 'Café', 'Pimentão']),
    );
  });

  it('should create default transaction categories for the new farm', async () => {
    await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    const farmId = inMemoryFarmRepository.items[0].id;
    const categories =
      await inMemoryTransactionCategoryRepository.findByFarmId(farmId);

    expect(categories).toHaveLength(6);
    expect(categories.map(c => c.name)).toEqual(
      expect.arrayContaining([
        'Venda de Produtos',
        'Insumos e Defensivos',
        'Sementes e Mudas',
        'Mão de Obra',
        'Equipamentos e Manutenção',
        'Combustível',
      ]),
    );
  });

  it('should notify that an account was created', async () => {
    await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(accountCreatedNotifier.notifications).toEqual([
      { name: 'Joao Paulo', email: 'joao@example.com' },
    ]);
  });

  it('should still create the account when the notification fails', async () => {
    accountCreatedNotifier.shouldFail = true;

    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
      inviteCode: INVITE_CODE,
    });

    expect(result.userId).toBeTruthy();
    expect(inMemoryFarmerRepository.items).toHaveLength(1);
    expect(inMemoryFarmerRepository.items[0].id).toBe(result.userId);
  });

  describe('gate de convite', () => {
    const user = {
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
    };

    it('should reject when no invite code is given', async () => {
      await expect(sut.execute({ ...user })).rejects.toBeInstanceOf(
        InviteRequiredError,
      );
      expect(inMemoryFarmRepository.items).toHaveLength(0);
      expect(inMemoryFarmerRepository.items).toHaveLength(0);
    });

    it('should reject a blank invite code', async () => {
      await expect(
        sut.execute({ ...user, inviteCode: '   ' }),
      ).rejects.toBeInstanceOf(InviteRequiredError);
    });

    it('should reject an unknown invite code', async () => {
      await expect(
        sut.execute({ ...user, inviteCode: 'CRESC-ZZZZ' }),
      ).rejects.toBeInstanceOf(InvalidInviteError);
    });

    it('should reject an exhausted invite', async () => {
      const invite = Invite.create({ code: 'CRESC-ONCE' });
      invite.redeem();
      inMemoryInviteRepository.items.push(invite);

      await expect(
        sut.execute({ ...user, inviteCode: 'CRESC-ONCE' }),
      ).rejects.toBeInstanceOf(InvalidInviteError);
    });

    it('should reject an expired invite', async () => {
      inMemoryInviteRepository.items.push(
        Invite.create({
          code: 'CRESC-OLD1',
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(
        sut.execute({ ...user, inviteCode: 'CRESC-OLD1' }),
      ).rejects.toBeInstanceOf(InvalidInviteError);
    });

    it('should reject a revoked invite', async () => {
      const invite = Invite.create({ code: 'CRESC-REVK' });
      invite.revoke();
      inMemoryInviteRepository.items.push(invite);

      await expect(
        sut.execute({ ...user, inviteCode: 'CRESC-REVK' }),
      ).rejects.toBeInstanceOf(InvalidInviteError);
    });

    it('should redeem the invite and link it to the new farm', async () => {
      const invite = Invite.create({ code: 'CRESC-GOOD' });
      inMemoryInviteRepository.items.push(invite);

      await sut.execute({ ...user, inviteCode: '  cresc-good  ' });

      expect(invite.usedCount).toBe(1);
      expect(invite.isUsable).toBe(false);
      expect(inMemoryFarmRepository.items[0].inviteId).toBe(invite.id);
      expect(inMemoryFarmRepository.items[0].accessStatus).toBe(
        FarmAccessStatus.COURTESY,
      );
    });

    it('should honour an invite with more than one use', async () => {
      inMemoryInviteRepository.items.push(
        Invite.create({ code: 'CRESC-COOP', maxUses: 2 }),
      );

      await sut.execute({
        ...user,
        email: 'a@example.com',
        inviteCode: 'CRESC-COOP',
      });
      await sut.execute({
        ...user,
        email: 'b@example.com',
        inviteCode: 'CRESC-COOP',
      });

      await expect(
        sut.execute({
          ...user,
          email: 'c@example.com',
          inviteCode: 'CRESC-COOP',
        }),
      ).rejects.toBeInstanceOf(InvalidInviteError);

      expect(inMemoryFarmRepository.items).toHaveLength(2);
    });
  });
});

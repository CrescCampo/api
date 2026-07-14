import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
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

describe('RegisterUserUseCase', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryFarmRepository = new InMemoryFarmRepository();
    inMemoryCultureRepository = new InMemoryCultureRepository();
    inMemoryTransactionCategoryRepository =
      new InMemoryTransactionCategoryRepository();
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
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it('should create a user linked to a new farm', async () => {
    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
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
    });

    expect(inMemoryFarmerRepository.items[0].emailVerified).toBe(false);
  });

  it('should persist a verification code and send it by email', async () => {
    const result = await sut.execute({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      password: 'secret',
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
    });

    expect(result.userId).toBeTruthy();
    expect(inMemoryFarmerRepository.items).toHaveLength(1);
    expect(inMemoryFarmerRepository.items[0].id).toBe(result.userId);
  });
});

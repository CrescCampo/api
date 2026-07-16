import OtpGenerator from 'domain/application/cryptography/otp-generator';
import VerificationEmailSender, {
  SendVerificationEmailInput,
} from 'domain/application/email/verification-email-sender';
import ResendVerificationCodeUseCase from 'domain/application/use-cases/auth/resend-verification-code';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import InMemoryEmailVerificationCodeRepository from '../../repositories/InMemoryEmailVerificationCodeRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeOtpGenerator implements OtpGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    return { plain: '654321', hash: this.hash('654321') };
  }

  hash(plain: string): string {
    return `hashed-${plain}`;
  }
}

class FakeVerificationEmailSender implements VerificationEmailSender {
  calls: SendVerificationEmailInput[] = [];

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    this.calls.push(input);
  }
}

let farmerRepository: InMemoryFarmerRepository;
let emailVerificationCodeRepository: InMemoryEmailVerificationCodeRepository;
let otpGenerator: FakeOtpGenerator;
let emailSender: FakeVerificationEmailSender;
let unitOfWork: InMemoryUnitOfWork;
let sut: ResendVerificationCodeUseCase;

async function seedFarmer(
  overrides: Partial<{ disabled: boolean; emailVerified: boolean }> = {},
): Promise<Farmer> {
  const farm = Farm.create({});
  const farmer = Farmer.create({
    name: 'Joao Paulo',
    email: 'joao@example.com',
    farmId: farm.id,
    password: 'hashed-secret',
    emailVerified: overrides.emailVerified ?? false,
    disabled: overrides.disabled ?? false,
  });
  await farmerRepository.save(farmer);
  return farmer;
}

describe('ResendVerificationCodeUseCase', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    emailVerificationCodeRepository =
      new InMemoryEmailVerificationCodeRepository();
    otpGenerator = new FakeOtpGenerator();
    emailSender = new FakeVerificationEmailSender();
    unitOfWork = new InMemoryUnitOfWork();

    sut = new ResendVerificationCodeUseCase(
      farmerRepository,
      emailVerificationCodeRepository,
      otpGenerator,
      emailSender,
      unitOfWork,
    );
  });

  it('should create a code and send it when no active code exists', async () => {
    await seedFarmer();

    await sut.execute({ email: 'joao@example.com' });

    expect(emailVerificationCodeRepository.items).toHaveLength(1);
    expect(emailVerificationCodeRepository.items[0].codeHash).toBe(
      'hashed-654321',
    );
    expect(emailSender.calls).toEqual([
      { to: 'joao@example.com', name: 'Joao', code: '654321' },
    ]);
  });

  it('should invalidate the previous code and create a new one', async () => {
    const farmer = await seedFarmer();
    const previous = EmailVerificationCode.create({
      farmerId: farmer.id,
      codeHash: 'hashed-111111',
      createdAt: new Date(Date.now() - 5 * 60_000),
    });
    await emailVerificationCodeRepository.save(previous);

    await sut.execute({ email: 'joao@example.com' });

    expect(previous.isInvalidated).toBe(true);
    const active = await emailVerificationCodeRepository.findActiveByFarmerId(
      farmer.id,
    );
    expect(active?.codeHash).toBe('hashed-654321');
    expect(emailSender.calls).toHaveLength(1);
  });

  it('should no-op within the cooldown window', async () => {
    const farmer = await seedFarmer();
    const recent = EmailVerificationCode.create({
      farmerId: farmer.id,
      codeHash: 'hashed-111111',
      createdAt: new Date(Date.now() - 10_000),
    });
    await emailVerificationCodeRepository.save(recent);

    await sut.execute({ email: 'joao@example.com' });

    expect(recent.isInvalidated).toBe(false);
    expect(emailVerificationCodeRepository.items).toHaveLength(1);
    expect(emailSender.calls).toHaveLength(0);
  });

  it('should not surface delivery failures to the caller', async () => {
    await seedFarmer();
    emailSender.sendVerificationEmail = () =>
      Promise.reject(new Error('provider is down'));

    await expect(
      sut.execute({ email: 'joao@example.com' }),
    ).resolves.toBeUndefined();
  });

  it('should persist the new code even when delivery fails', async () => {
    await seedFarmer();
    emailSender.sendVerificationEmail = () =>
      Promise.reject(new Error('provider is down'));

    await sut.execute({ email: 'joao@example.com' });

    expect(emailVerificationCodeRepository.items).toHaveLength(1);
  });

  it('should silently no-op when the farmer does not exist', async () => {
    await sut.execute({ email: 'missing@example.com' });

    expect(emailVerificationCodeRepository.items).toHaveLength(0);
    expect(emailSender.calls).toHaveLength(0);
  });

  it('should silently no-op when the farmer is disabled', async () => {
    await seedFarmer({ disabled: true });

    await sut.execute({ email: 'joao@example.com' });

    expect(emailSender.calls).toHaveLength(0);
  });

  it('should silently no-op when the email is already verified', async () => {
    await seedFarmer({ emailVerified: true });

    await sut.execute({ email: 'joao@example.com' });

    expect(emailSender.calls).toHaveLength(0);
  });
});

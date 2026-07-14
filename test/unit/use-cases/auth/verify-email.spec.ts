import Encrypter from 'domain/application/cryptography/encrypter';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import EmailAlreadyVerifiedError from 'domain/application/errors/auth/EmailAlreadyVerifiedError';
import InvalidVerificationCodeError from 'domain/application/errors/auth/InvalidVerificationCodeError';
import SessionIssuer from 'domain/application/services/session-issuer';
import VerifyEmailUseCase from 'domain/application/use-cases/auth/verify-email';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import InMemoryEmailVerificationCodeRepository from '../../repositories/InMemoryEmailVerificationCodeRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryRefreshTokenRepository from '../../repositories/InMemoryRefreshTokenRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeEncrypter implements Encrypter {
  payloads: Record<string, unknown>[] = [];

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    this.payloads.push(payload);
    return 'token';
  }
}

class FakeTokenGenerator implements TokenGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    return { plain: 'refresh-plain', hash: this.hash('refresh-plain') };
  }

  hash(plain: string): string {
    return `hashed-${plain}`;
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

let farmerRepository: InMemoryFarmerRepository;
let emailVerificationCodeRepository: InMemoryEmailVerificationCodeRepository;
let refreshTokenRepository: InMemoryRefreshTokenRepository;
let otpGenerator: FakeOtpGenerator;
let sessionIssuer: SessionIssuer;
let unitOfWork: InMemoryUnitOfWork;
let sut: VerifyEmailUseCase;

async function seedUnverifiedFarmer(
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

async function seedCode(
  farmer: Farmer,
  overrides: Partial<{
    codeHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    invalidatedAt: Date | null;
    attempts: number;
  }> = {},
): Promise<EmailVerificationCode> {
  const code = EmailVerificationCode.create({
    farmerId: farmer.id,
    codeHash: overrides.codeHash ?? 'hashed-123456',
    expiresAt: overrides.expiresAt,
    usedAt: overrides.usedAt ?? null,
    invalidatedAt: overrides.invalidatedAt ?? null,
    attempts: overrides.attempts ?? 0,
  });
  await emailVerificationCodeRepository.save(code);
  return code;
}

describe('VerifyEmailUseCase', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    emailVerificationCodeRepository =
      new InMemoryEmailVerificationCodeRepository();
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    otpGenerator = new FakeOtpGenerator();
    sessionIssuer = new SessionIssuer(
      new FakeTokenGenerator(),
      new FakeEncrypter(),
    );
    unitOfWork = new InMemoryUnitOfWork();

    sut = new VerifyEmailUseCase(
      farmerRepository,
      emailVerificationCodeRepository,
      otpGenerator,
      sessionIssuer,
      refreshTokenRepository,
      unitOfWork,
    );
  });

  it('should verify the email, log the farmer in and return tokens', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer);

    const result = await sut.execute({
      email: 'joao@example.com',
      code: '123456',
    });

    expect(result.userId).toBe(farmer.id);
    expect(result.token).toBe('token');
    expect(result.refreshToken).toBe('refresh-plain');
    expect(farmerRepository.items[0].emailVerified).toBe(true);
    expect(farmerRepository.items[0].lastLogin).not.toBeNull();
    expect(emailVerificationCodeRepository.items[0].usedAt).not.toBeNull();
    expect(refreshTokenRepository.items).toHaveLength(1);
  });

  it('should register a failed attempt and reject an invalid code', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer);

    await expect(
      sut.execute({ email: 'joao@example.com', code: '000000' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);

    expect(emailVerificationCodeRepository.items[0].attempts).toBe(1);
    expect(farmerRepository.items[0].emailVerified).toBe(false);
  });

  it('should lock the code after five failed attempts', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer, { attempts: 5 });

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);

    expect(farmerRepository.items[0].emailVerified).toBe(false);
  });

  it('should reject an expired code', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer, { expiresAt: new Date(Date.now() - 60_000) });

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);
  });

  it('should reject an already used code', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer, { usedAt: new Date() });

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);
  });

  it('should reject an invalidated code', async () => {
    const farmer = await seedUnverifiedFarmer();
    await seedCode(farmer, { invalidatedAt: new Date() });

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);
  });

  it('should reject with a generic error when the farmer does not exist', async () => {
    await expect(
      sut.execute({ email: 'missing@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);
  });

  it('should reject with a generic error when the farmer is disabled', async () => {
    const farmer = await seedUnverifiedFarmer({ disabled: true });
    await seedCode(farmer);

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidVerificationCodeError);
  });

  it('should reject when the email is already verified', async () => {
    const farmer = await seedUnverifiedFarmer({ emailVerified: true });
    await seedCode(farmer);

    await expect(
      sut.execute({ email: 'joao@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(EmailAlreadyVerifiedError);
  });
});

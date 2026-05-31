import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import InvalidPasswordResetTokenError from 'domain/application/errors/auth/InvalidPasswordResetTokenError';
import ResetPasswordUseCase from 'domain/application/use-cases/farmers/reset-password';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryPasswordResetTokenRepository from '../../repositories/InMemoryPasswordResetTokenRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeTokenGenerator implements TokenGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    return { plain: 'plain-token', hash: this.hash('plain-token') };
  }

  hash(plain: string): string {
    return `hashed-${plain}`;
  }
}

class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

let farmerRepository: InMemoryFarmerRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let tokenGenerator: FakeTokenGenerator;
let hashGenerator: FakeHashGenerator;
let unitOfWork: InMemoryUnitOfWork;
let sut: ResetPasswordUseCase;

function createFarmer(overrides: Partial<{ disabled: boolean }> = {}) {
  const farm = Farm.create({});
  return Farmer.create({
    name: 'Joao',
    email: 'joao@example.com',
    farmId: farm.id,
    password: 'hashed-old-secret',
    disabled: overrides.disabled ?? false,
  });
}

describe('ResetPasswordUseCase', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
    tokenGenerator = new FakeTokenGenerator();
    hashGenerator = new FakeHashGenerator();
    unitOfWork = new InMemoryUnitOfWork();

    sut = new ResetPasswordUseCase(
      farmerRepository,
      passwordResetTokenRepository,
      tokenGenerator,
      hashGenerator,
      unitOfWork,
    );
  });

  it('updates the password and marks the token as used', async () => {
    const farmer = createFarmer();
    await farmerRepository.save(farmer);

    const token = PasswordResetToken.create({
      farmerId: farmer.id,
      tokenHash: tokenGenerator.hash('plain-token'),
    });
    await passwordResetTokenRepository.save(token);

    await sut.execute({ token: 'plain-token', newPassword: 'new-secret' });

    expect(farmer.password).toBe('hashed-new-secret');
    expect(passwordResetTokenRepository.items[0].isUsed).toBe(true);
    expect(unitOfWork.commitCount).toBe(1);
  });

  it('throws when the token does not exist', async () => {
    await expect(
      sut.execute({ token: 'plain-token', newPassword: 'new-secret' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
    expect(unitOfWork.commitCount).toBe(0);
  });

  it('throws when the token is already used', async () => {
    const farmer = createFarmer();
    await farmerRepository.save(farmer);

    const token = PasswordResetToken.create({
      farmerId: farmer.id,
      tokenHash: tokenGenerator.hash('plain-token'),
      usedAt: new Date(),
    });
    await passwordResetTokenRepository.save(token);

    await expect(
      sut.execute({ token: 'plain-token', newPassword: 'new-secret' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
    expect(farmer.password).toBe('hashed-old-secret');
  });

  it('throws when the token is expired', async () => {
    const farmer = createFarmer();
    await farmerRepository.save(farmer);

    const token = PasswordResetToken.create({
      farmerId: farmer.id,
      tokenHash: tokenGenerator.hash('plain-token'),
      expiresAt: new Date(Date.now() - 60_000),
    });
    await passwordResetTokenRepository.save(token);

    await expect(
      sut.execute({ token: 'plain-token', newPassword: 'new-secret' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it('throws when the farmer is disabled', async () => {
    const farmer = createFarmer({ disabled: true });
    await farmerRepository.save(farmer);

    const token = PasswordResetToken.create({
      farmerId: farmer.id,
      tokenHash: tokenGenerator.hash('plain-token'),
    });
    await passwordResetTokenRepository.save(token);

    await expect(
      sut.execute({ token: 'plain-token', newPassword: 'new-secret' }),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
  });
});

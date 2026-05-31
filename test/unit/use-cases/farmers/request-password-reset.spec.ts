import ResetPasswordEmailSender, {
  SendResetPasswordEmailInput,
} from 'domain/application/email/reset-password-email-sender';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import PasswordResetChangeUseCase from 'domain/application/use-cases/farmers/request-password-reset';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
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

class FakeResetPasswordEmailSender implements ResetPasswordEmailSender {
  calls: SendResetPasswordEmailInput[] = [];

  async sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<void> {
    this.calls.push(input);
  }
}

let farmerRepository: InMemoryFarmerRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let unitOfWork: InMemoryUnitOfWork;
let tokenGenerator: FakeTokenGenerator;
let emailSender: FakeResetPasswordEmailSender;
let sut: PasswordResetChangeUseCase;

describe('PasswordResetChangeUseCase', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
    unitOfWork = new InMemoryUnitOfWork();
    tokenGenerator = new FakeTokenGenerator();
    emailSender = new FakeResetPasswordEmailSender();

    sut = new PasswordResetChangeUseCase(
      farmerRepository,
      unitOfWork,
      tokenGenerator,
      passwordResetTokenRepository,
      emailSender,
    );
  });

  it('should silently no-op when the farmer is not found', async () => {
    await sut.execute({
      email: 'missing@example.com',
      userAgent: 'jest',
      requestIp: 'ip-stub',
    });

    expect(passwordResetTokenRepository.items).toHaveLength(0);
    expect(emailSender.calls).toHaveLength(0);
    expect(unitOfWork.commitCount).toBe(0);
  });

  it('should persist a token with the hashed value and default ttl', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Joao',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });
    await farmerRepository.save(farmer);

    await sut.execute({
      email: 'joao@example.com',
      userAgent: 'jest-agent',
      requestIp: 'ip-stub',
    });

    expect(passwordResetTokenRepository.items).toHaveLength(1);
    const stored = passwordResetTokenRepository.items[0];
    expect(stored.farmerId).toBe(farmer.id);
    expect(stored.tokenHash).toBe('hashed-plain-token');
    expect(stored.ttlMinutes).toBe(30);
    expect(stored.requestIp).toBe('ip-stub');
    expect(stored.userAgent).toBe('jest-agent');
    expect(stored.usedAt).toBeNull();
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should send the reset email with the plain token, recipient and first name', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });
    await farmerRepository.save(farmer);

    await sut.execute({
      email: 'maria@example.com',
      userAgent: 'jest-agent',
      requestIp: 'ip-stub',
    });

    expect(emailSender.calls).toHaveLength(1);
    expect(emailSender.calls[0]).toEqual({
      token: 'plain-token',
      to: 'maria@example.com',
      name: 'Maria',
    });
    expect(unitOfWork.commitCount).toBe(1);
  });

  it('should send only the first name when the farmer has a full name', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Silva',
      email: 'maria.silva@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });
    await farmerRepository.save(farmer);

    await sut.execute({
      email: 'maria.silva@example.com',
      userAgent: 'jest-agent',
      requestIp: 'ip-stub',
    });

    expect(emailSender.calls[0].name).toBe('Maria');
    expect(emailSender.calls[0].to).toBe('maria.silva@example.com');
  });
});

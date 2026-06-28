import Encrypter from 'domain/application/cryptography/encrypter';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import EmailNotVerifiedByProviderError from 'domain/application/errors/auth/EmailNotVerifiedByProviderError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import GoogleTokenVerifier, {
  GoogleUserInfo,
} from 'domain/application/gateways/google-token-verifier';
import AccountCreatedNotifier, {
  AccountCreatedNotification,
} from 'domain/application/notifications/account-created-notifier';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import LoginFarmerWithGoogle from 'domain/application/use-cases/auth/login-farmer-with-google';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import InMemoryFarmRepository from '../../repositories/InMemoryFarmRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryCultureRepository from '../../repositories/InMemoryCultureRepository';
import InMemoryTransactionCategoryRepository from '../../repositories/InMemoryTransactionCategoryRepository';
import InMemoryRefreshTokenRepository from '../../repositories/InMemoryRefreshTokenRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeGoogleTokenVerifier implements GoogleTokenVerifier {
  result: GoogleUserInfo = {
    sub: 'google-sub-1',
    email: 'maria@example.com',
    emailVerified: true,
    name: 'Maria Clara',
  };

  async verify(): Promise<GoogleUserInfo> {
    return this.result;
  }
}

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

class FakeAccountCreatedNotifier implements AccountCreatedNotifier {
  notifications: AccountCreatedNotification[] = [];

  async notifyAccountCreated(input: AccountCreatedNotification): Promise<void> {
    this.notifications.push(input);
  }
}

let farmerRepository: InMemoryFarmerRepository;
let farmRepository: InMemoryFarmRepository;
let cultureRepository: InMemoryCultureRepository;
let transactionCategoryRepository: InMemoryTransactionCategoryRepository;
let refreshTokenRepository: InMemoryRefreshTokenRepository;
let unitOfWork: InMemoryUnitOfWork;
let googleTokenVerifier: FakeGoogleTokenVerifier;
let encrypter: FakeEncrypter;
let tokenGenerator: FakeTokenGenerator;
let accountCreatedNotifier: FakeAccountCreatedNotifier;
let sut: LoginFarmerWithGoogle;

describe('LoginFarmerWithGoogle', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    farmRepository = new InMemoryFarmRepository();
    cultureRepository = new InMemoryCultureRepository();
    transactionCategoryRepository = new InMemoryTransactionCategoryRepository();
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    unitOfWork = new InMemoryUnitOfWork();
    googleTokenVerifier = new FakeGoogleTokenVerifier();
    encrypter = new FakeEncrypter();
    tokenGenerator = new FakeTokenGenerator();
    accountCreatedNotifier = new FakeAccountCreatedNotifier();

    const farmerProvisioner = new FarmerProvisioner(
      farmerRepository,
      farmRepository,
      cultureRepository,
      transactionCategoryRepository,
    );

    sut = new LoginFarmerWithGoogle(
      googleTokenVerifier,
      farmerRepository,
      farmerProvisioner,
      refreshTokenRepository,
      tokenGenerator,
      encrypter,
      unitOfWork,
      accountCreatedNotifier,
    );
  });

  it('should provision a new account on first Google login', async () => {
    const result = await sut.execute({ idToken: 'any' });

    expect(farmerRepository.items).toHaveLength(1);
    expect(farmRepository.items).toHaveLength(1);
    expect(result.userId).toBe(farmerRepository.items[0].id);
    expect(result.email).toBe('maria@example.com');
    expect(result.hasPassword).toBe(false);
    expect(farmerRepository.items[0].googleId).toBe('google-sub-1');
    expect(refreshTokenRepository.items).toHaveLength(1);
    expect(accountCreatedNotifier.notifications).toHaveLength(1);
  });

  it('should link Google to an existing email/password account', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });
    await farmerRepository.save(farmer);

    const result = await sut.execute({ idToken: 'any' });

    expect(farmerRepository.items).toHaveLength(1);
    expect(result.userId).toBe(farmer.id);
    expect(result.hasPassword).toBe(true);
    expect(farmerRepository.items[0].googleId).toBe('google-sub-1');
    expect(accountCreatedNotifier.notifications).toHaveLength(0);
  });

  it('should authenticate an account already linked by googleId', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      googleId: 'google-sub-1',
    });
    await farmerRepository.save(farmer);

    const result = await sut.execute({ idToken: 'any' });

    expect(farmerRepository.items).toHaveLength(1);
    expect(result.userId).toBe(farmer.id);
    expect(result.hasPassword).toBe(false);
  });

  it('should reject when Google email is not verified', async () => {
    googleTokenVerifier.result = {
      ...googleTokenVerifier.result,
      emailVerified: false,
    };

    await expect(sut.execute({ idToken: 'any' })).rejects.toBeInstanceOf(
      EmailNotVerifiedByProviderError,
    );
    expect(farmerRepository.items).toHaveLength(0);
  });

  it('should reject when the account is disabled', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      googleId: 'google-sub-1',
      disabled: true,
    });
    await farmerRepository.save(farmer);

    await expect(sut.execute({ idToken: 'any' })).rejects.toBeInstanceOf(
      WrongCredentialsError,
    );
  });
});

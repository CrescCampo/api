import Encrypter from 'domain/application/cryptography/encrypter';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import InvalidTokenError from 'domain/application/errors/auth/InvalidTokenError';
import RefreshTokenUseCase from 'domain/application/use-cases/auth/refresh-token';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryRefreshTokenRepository from '../../repositories/InMemoryRefreshTokenRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeTokenGenerator implements TokenGenerator {
  private counter = 0;

  async generate(): Promise<{ plain: string; hash: string }> {
    this.counter += 1;
    const plain = `plain-${this.counter}`;
    return { plain, hash: this.hash(plain) };
  }

  hash(plain: string): string {
    return `hashed-${plain}`;
  }
}

class FakeEncrypter implements Encrypter {
  payloads: Record<string, unknown>[] = [];

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    this.payloads.push(payload);
    return 'access-token';
  }
}

let refreshTokenRepository: InMemoryRefreshTokenRepository;
let farmerRepository: InMemoryFarmerRepository;
let tokenGenerator: FakeTokenGenerator;
let unitOfWork: InMemoryUnitOfWork;
let encrypter: FakeEncrypter;
let sut: RefreshTokenUseCase;

function makeFarmer() {
  const farm = Farm.create({});
  return Farmer.create({
    name: 'Joao Paulo',
    email: 'joao@example.com',
    farmId: farm.id,
    password: 'hashed-secret',
  });
}

describe('RefreshTokenUseCase', () => {
  beforeEach(() => {
    refreshTokenRepository = new InMemoryRefreshTokenRepository();
    farmerRepository = new InMemoryFarmerRepository();
    tokenGenerator = new FakeTokenGenerator();
    unitOfWork = new InMemoryUnitOfWork();
    encrypter = new FakeEncrypter();

    sut = new RefreshTokenUseCase(
      refreshTokenRepository,
      farmerRepository,
      tokenGenerator,
      unitOfWork,
      encrypter,
    );
  });

  it('should rotate the refresh token and return new access and refresh tokens', async () => {
    const farmer = makeFarmer();
    await farmerRepository.save(farmer);

    const currentToken = RefreshToken.create({
      farmerId: farmer.id,
      hash: 'hashed-valid',
    });
    await refreshTokenRepository.save(currentToken);

    const result = await sut.execute({ plain: 'valid' });

    expect(result.token).toBe('access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    expect(unitOfWork.commitCount).toBe(1);

    const rotated = await refreshTokenRepository.findById(currentToken.id);
    expect(rotated?.isRotated).toBe(true);

    expect(refreshTokenRepository.items).toHaveLength(2);
    const newToken = refreshTokenRepository.items.find(
      item => item.id !== currentToken.id,
    );
    expect(newToken?.familyId).toBe(currentToken.familyId);
    expect(newToken?.isRotated).toBe(false);

    expect(encrypter.payloads[0]).toMatchObject({
      id: farmer.id,
      sessionId: currentToken.familyId,
    });
  });

  it('should throw when the refresh token does not exist', async () => {
    await expect(sut.execute({ plain: 'unknown' })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it('should detect reuse of an already rotated token and revoke the whole family', async () => {
    const farmer = makeFarmer();
    await farmerRepository.save(farmer);

    const familyId = 'family-1';
    const reusedToken = RefreshToken.create({
      farmerId: farmer.id,
      hash: 'hashed-reused',
      familyId,
      replacedById: 'some-next-id',
    });
    const siblingToken = RefreshToken.create({
      farmerId: farmer.id,
      hash: 'hashed-sibling',
      familyId,
    });
    await refreshTokenRepository.save(reusedToken);
    await refreshTokenRepository.save(siblingToken);

    await expect(sut.execute({ plain: 'reused' })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );

    for (const item of refreshTokenRepository.items) {
      expect(item.isRevoked).toBe(true);
    }
  });

  it('should throw when the refresh token is expired', async () => {
    const farmer = makeFarmer();
    await farmerRepository.save(farmer);

    const expiredToken = RefreshToken.create({
      farmerId: farmer.id,
      hash: 'hashed-expired',
      expiresAt: new Date(Date.now() - 1000),
    });
    await refreshTokenRepository.save(expiredToken);

    await expect(sut.execute({ plain: 'expired' })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it('should revoke the family and throw when the farmer no longer exists', async () => {
    const orphanToken = RefreshToken.create({
      farmerId: 'non-existent-farmer',
      hash: 'hashed-orphan',
    });
    await refreshTokenRepository.save(orphanToken);

    await expect(sut.execute({ plain: 'orphan' })).rejects.toBeInstanceOf(
      InvalidTokenError,
    );

    const revoked = await refreshTokenRepository.findById(orphanToken.id);
    expect(revoked?.isRevoked).toBe(true);
  });
});

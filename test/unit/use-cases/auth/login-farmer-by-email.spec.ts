import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let hashComparer: HashComparer;
let encrypter: Encrypter;
let hashGenerator: HashGenerator;
let sut: LoginFarmerByEmail;

class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed-${plain}`;
  }
}

class FakeEncrypter implements Encrypter {
  payloads: Record<string, unknown>[] = [];

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    this.payloads.push(payload);
    return 'token';
  }
}

class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

describe('LoginFarmerByEmail', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    hashComparer = new FakeHashComparer();
    encrypter = new FakeEncrypter();
    hashGenerator = new FakeHashGenerator();

    sut = new LoginFarmerByEmail(
      inMemoryFarmerRepository,
      hashComparer,
      hashGenerator,
      encrypter,
    );
  });

  it('should throw when farmer does not exist', async () => {
    await expect(
      sut.execute({ email: 'notfound@example.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(WrongCredentialsError);
  });

  it('should throw when password is invalid', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });

    await inMemoryFarmerRepository.save(farmer);

    await expect(
      sut.execute({ email: 'joao@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(WrongCredentialsError);
  });

  it('should throw when farmer is disabled', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Ana Maria',
      email: 'ana@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
      disabled: true,
    });

    await inMemoryFarmerRepository.save(farmer);

    await expect(
      sut.execute({ email: 'ana@example.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(WrongCredentialsError);
  });

  it('should authenticate a farmer and return a token', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({
      email: 'maria@example.com',
      password: 'secret',
    });

    expect(result.userId).toBe(farmer.id);
    expect(result.token).toBe('token');
    expect(inMemoryFarmerRepository.items[0].lastLogin).not.toBeNull();
    expect((encrypter as FakeEncrypter).payloads[0]).toEqual({
      farmId: farmer.farmId,
      id: farmer.id,
      email: farmer.email,
      name: farmer.name,
      phone: null,
    });
  });
});

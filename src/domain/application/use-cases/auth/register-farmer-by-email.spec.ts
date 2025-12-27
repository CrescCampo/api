import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import InMemoryFarmRepository from '../../../../../test/unit/repositories/InMemoryFarmRepository';
import InMemoryFarmerRepository from '../../../../../test/unit/repositories/InMemoryFarmerRepository';
import RegisterUserUseCase from './register-farmer-by-email';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryFarmRepository: InMemoryFarmRepository;
let hashGenerator: HashGenerator;
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
    hashGenerator = new FakeHashGenerator();

    sut = new RegisterUserUseCase(
      inMemoryFarmerRepository,
      inMemoryFarmRepository,
      hashGenerator,
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
});

import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import InMemoryFarmRepository from '../../repositories/InMemoryFarmRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryCultureRepository from '../../repositories/InMemoryCultureRepository';
import InMemoryTransactionCategoryRepository from '../../repositories/InMemoryTransactionCategoryRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';
import NoopTracer from '../../tracing/NoopTracer';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryFarmRepository: InMemoryFarmRepository;
let inMemoryCultureRepository: InMemoryCultureRepository;
let inMemoryTransactionCategoryRepository: InMemoryTransactionCategoryRepository;
let hashGenerator: HashGenerator;
let unitOfWork: InMemoryUnitOfWork;
let tracer: NoopTracer;
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
    hashGenerator = new FakeHashGenerator();
    unitOfWork = new InMemoryUnitOfWork();
    tracer = new NoopTracer();

    sut = new RegisterUserUseCase(
      inMemoryFarmerRepository,
      inMemoryFarmRepository,
      hashGenerator,
      inMemoryCultureRepository,
      inMemoryTransactionCategoryRepository,
      unitOfWork,
      tracer,
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
});

import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryCultureRepository from '../../repositories/InMemoryCultureRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';
import InMemoryTransactionCategoryRepository from '../../repositories/InMemoryTransactionCategoryRepository';
import InMemoryTransactionRepository from '../../repositories/InMemoryTransactionRepository';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryCultureRepository: InMemoryCultureRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let inMemoryTransactionCategoryRepository: InMemoryTransactionCategoryRepository;
let inMemoryTransactionRepository: InMemoryTransactionRepository;
let sut: AppPullUseCase;

describe('AppPullUseCase', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryCultureRepository = new InMemoryCultureRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    inMemoryTransactionCategoryRepository =
      new InMemoryTransactionCategoryRepository();
    inMemoryTransactionRepository = new InMemoryTransactionRepository();
    sut = new AppPullUseCase(
      inMemoryFarmerRepository,
      inMemoryCultureRepository,
      inMemoryHarvestRepository,
      inMemoryTransactionCategoryRepository,
      inMemoryTransactionRepository,
    );
  });

  it('should throw when farmer does not exist', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow(
      'Farmer non-existent not found',
    );
  });

  it('should return empty collections when farm has no data', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute(farmer.id);

    expect(result.cultures).toHaveLength(0);
    expect(result.activeHarvests).toHaveLength(0);
    expect(result.recentHarvests).toHaveLength(0);
    expect(result.transactionCategories).toHaveLength(0);
    expect(result.transactions).toHaveLength(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.totalProfit).toBe(0);
  });

  it('should return correct pagination meta for harvests and transactions', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute(farmer.id);

    expect(result.harvestsPagination.meta.currentPage).toBe(1);
    expect(result.harvestsPagination.meta.items).toBe(0);
    expect(result.harvestsPagination.meta.totalItems).toBe(0);
    expect(result.transactionsPagination.meta.currentPage).toBe(1);
    expect(result.transactionsPagination.meta.items).toBe(0);
    expect(result.transactionsPagination.meta.totalItems).toBe(0);
  });

  it('should return cultures mapped to DTOs', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryCultureRepository.save(culture);

    const result = await sut.execute(farmer.id);

    expect(result.cultures).toHaveLength(1);
    expect(result.cultures[0].id).toBe(culture.id);
    expect(result.cultures[0].name).toBe('Soja');
  });

  it('should return active and recent harvests mapped to DTOs', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const activeHarvest = Harvest.create({
      name: 'Safra Ativa',
      culture,
      startDate,
      farmId: farm.id,
      revenue: 2000,
      expenses: 800,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(activeHarvest);

    const result = await sut.execute(farmer.id);

    expect(result.activeHarvests).toHaveLength(1);
    expect(result.activeHarvests[0].id).toBe(activeHarvest.id);
    expect(result.activeHarvests[0].name).toBe('Safra Ativa');
    expect(result.activeHarvests[0].cultureId).toBe(culture.id);
    expect(result.activeHarvests[0].startDate).toBe(startDate.getTime());
    expect(result.activeHarvests[0].endDate).toBeUndefined();
    expect(result.activeHarvests[0].revenue).toBe(2000);
    expect(result.activeHarvests[0].expenses).toBe(800);

    expect(result.recentHarvests).toHaveLength(1);
    expect(result.recentHarvests[0].id).toBe(activeHarvest.id);
  });

  it('should include endDate in harvest DTO for finished harvests', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const endDate = new Date('2025-12-31T00:00:00.000Z');
    const finishedHarvest = Harvest.create({
      name: 'Safra Finalizada',
      culture,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate,
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(finishedHarvest);

    const result = await sut.execute(farmer.id);

    expect(result.recentHarvests[0].endDate).toBe(endDate.getTime());
  });

  it('should return transaction categories mapped to DTOs', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const category = TransactionCategory.create({
      name: 'Insumos',
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionCategoryRepository.save(category);

    const result = await sut.execute(farmer.id);

    expect(result.transactionCategories).toHaveLength(1);
    expect(result.transactionCategories[0].id).toBe(category.id);
    expect(result.transactionCategories[0].name).toBe('Insumos');
  });

  it('should return transactions mapped to DTOs', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const category = TransactionCategory.create({
      name: 'Vendas',
      farmId: farm.id,
    });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const date = new Date('2025-06-01T00:00:00.000Z');
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.REVENUE,
      description: 'Venda de soja',
      amount: 1500,
      category,
      date,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionRepository.save(transaction);

    const result = await sut.execute(farmer.id);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe(transaction.id);
    expect(result.transactions[0].harvestId).toBe(harvest.id);
    expect(result.transactions[0].type).toBe(TransactionType.REVENUE);
    expect(result.transactions[0].description).toBe('Venda de soja');
    expect(result.transactions[0].amount).toBe(1500);
    expect(result.transactions[0].categoryId).toBe(category.id);
    expect(result.transactions[0].date).toBe(date.getTime());
  });

  it('should calculate totalRevenue, totalExpenses and totalProfit from harvests', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest1 = Harvest.create({
      name: 'Safra 2024',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      revenue: 3000,
      expenses: 1000,
    });
    const harvest2 = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      revenue: 5000,
      expenses: 2000,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest1);
    await inMemoryHarvestRepository.save(harvest2);

    const result = await sut.execute(farmer.id);

    expect(result.totalRevenue).toBe(8000);
    expect(result.totalExpenses).toBe(3000);
    expect(result.totalProfit).toBe(5000);
  });

  it('should limit recentHarvests and transactions to 10 items', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const category = TransactionCategory.create({
      name: 'Insumos',
      farmId: farm.id,
    });

    for (let i = 0; i < 15; i++) {
      const harvest = Harvest.create({
        name: `Safra ${i}`,
        culture,
        startDate: new Date(2025, 0, i + 1),
        farmId: farm.id,
      });
      await inMemoryHarvestRepository.save(harvest);

      const transaction = Transaction.create({
        harvestId: harvest.id,
        type: TransactionType.EXPENSE,
        description: `Despesa ${i}`,
        amount: 100,
        category,
        date: new Date(2025, 0, i + 1),
      });
      await inMemoryTransactionRepository.save(transaction);
    }

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute(farmer.id);

    expect(result.recentHarvests).toHaveLength(10);
    expect(result.harvestsPagination.meta.items).toBe(10);
    expect(result.harvestsPagination.meta.totalItems).toBe(15);

    expect(result.transactions).toHaveLength(10);
    expect(result.transactionsPagination.meta.items).toBe(10);
    expect(result.transactionsPagination.meta.totalItems).toBe(15);
  });

  it('should only return data from the farmer farm', async () => {
    const farm1 = Farm.create({});
    const farm2 = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm1.id,
      password: 'hashed',
    });
    const culture1 = Culture.create({ name: 'Soja', farmId: farm1.id });
    const culture2 = Culture.create({ name: 'Milho', farmId: farm2.id });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryCultureRepository.save(culture1);
    await inMemoryCultureRepository.save(culture2);

    const result = await sut.execute(farmer.id);

    expect(result.cultures).toHaveLength(1);
    expect(result.cultures[0].id).toBe(culture1.id);
  });
});

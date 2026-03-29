import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';
import InMemoryTransactionRepository from '../../repositories/InMemoryTransactionRepository';
import ListTransactionsByHarvest from 'domain/application/use-cases/transactions/list-transactions-by-harvest';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let inMemoryTransactionRepository: InMemoryTransactionRepository;
let sut: ListTransactionsByHarvest;

describe('ListTransactionsByHarvest', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    inMemoryTransactionRepository = new InMemoryTransactionRepository();
    sut = new ListTransactionsByHarvest(
      inMemoryFarmerRepository,
      inMemoryHarvestRepository,
      inMemoryTransactionRepository,
    );
  });

  it('should throw when farmer does not exist', async () => {
    await expect(
      sut.execute({ userId: 'non-existent', harvestId: 'harvest-id' }),
    ).rejects.toThrow('Farmer non-existent not found');
  });

  it('should throw when harvest does not exist', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    await expect(
      sut.execute({ userId: farmer.id, harvestId: 'non-existent' }),
    ).rejects.toThrow('Harvest non-existent not found for farmer');
  });

  it('should throw when harvest belongs to another farm', async () => {
    const farm1 = Farm.create({});
    const farm2 = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm1.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm2.id });
    const harvest = Harvest.create({
      name: 'Safra Farm 2',
      culture,
      startDate: new Date(),
      farmId: farm2.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    await expect(
      sut.execute({ userId: farmer.id, harvestId: harvest.id }),
    ).rejects.toThrow(`Harvest ${harvest.id} not found for farmer`);
  });

  it('should return empty list when no transactions exist for the harvest', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({ userId: farmer.id, harvestId: harvest.id });

    expect(result.transactions).toHaveLength(0);
    expect(result.pagination.meta.totalItems).toBe(0);
    expect(result.pagination.meta.currentPage).toBe(1);
    expect(result.pagination.meta.items).toBe(0);
  });

  it('should return transactions with correct DTO mapping', async () => {
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
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const date = new Date('2025-06-01T00:00:00.000Z');
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Compra de sementes',
      amount: 300,
      category,
      date,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);
    await inMemoryTransactionRepository.save(transaction);

    const result = await sut.execute({ userId: farmer.id, harvestId: harvest.id });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe(transaction.id);
    expect(result.transactions[0].harvestId).toBe(harvest.id);
    expect(result.transactions[0].type).toBe(TransactionType.EXPENSE);
    expect(result.transactions[0].description).toBe('Compra de sementes');
    expect(result.transactions[0].amount).toBe(300);
    expect(result.transactions[0].categoryId).toBe(category.id);
    expect(result.transactions[0].date).toBe(date.getTime());
  });

  it('should default to page 1 and pageSize 10 when not provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({ userId: farmer.id, harvestId: harvest.id });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should use provided page and pageSize for pagination', async () => {
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
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    for (let i = 0; i < 12; i++) {
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
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({
      userId: farmer.id,
      harvestId: harvest.id,
      page: 2,
      pageSize: 5,
    });

    expect(result.transactions).toHaveLength(5);
    expect(result.pagination.meta.currentPage).toBe(2);
    expect(result.pagination.meta.totalItems).toBe(12);
    expect(result.pagination.meta.items).toBe(5);
  });

  it('should fallback to page 1 when invalid page is provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({
      userId: farmer.id,
      harvestId: harvest.id,
      page: -5,
    });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should only return transactions from the specified harvest', async () => {
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
    const harvest1 = Harvest.create({
      name: 'Safra 2024',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const harvest2 = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const txHarvest1 = Transaction.create({
      harvestId: harvest1.id,
      type: TransactionType.EXPENSE,
      description: 'Despesa Safra 1',
      amount: 100,
      category,
      date: new Date(),
    });
    const txHarvest2 = Transaction.create({
      harvestId: harvest2.id,
      type: TransactionType.REVENUE,
      description: 'Receita Safra 2',
      amount: 500,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest1);
    await inMemoryHarvestRepository.save(harvest2);
    await inMemoryTransactionRepository.save(txHarvest1);
    await inMemoryTransactionRepository.save(txHarvest2);

    const result = await sut.execute({ userId: farmer.id, harvestId: harvest1.id });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].harvestId).toBe(harvest1.id);
  });
});

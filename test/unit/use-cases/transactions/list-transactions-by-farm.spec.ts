import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import ListTransactionsByFarm from 'domain/application/use-cases/transactions/list-transactions-by-farm';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryTransactionRepository from '../../repositories/InMemoryTransactionRepository';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryTransactionRepository: InMemoryTransactionRepository;
let sut: ListTransactionsByFarm;

describe('ListTransactionsByFarm', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryTransactionRepository = new InMemoryTransactionRepository();
    sut = new ListTransactionsByFarm(
      inMemoryFarmerRepository,
      inMemoryTransactionRepository,
    );
  });

  it('should throw FarmerNotFoundError when farmer does not exist', async () => {
    await expect(
      sut.execute({ userId: 'non-existent' }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should return empty list when no transactions exist', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id });

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
      amount: 500,
      category,
      date,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionRepository.save(transaction);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toBe(transaction.id);
    expect(result.transactions[0].harvestId).toBe(harvest.id);
    expect(result.transactions[0].type).toBe(TransactionType.EXPENSE);
    expect(result.transactions[0].description).toBe('Compra de sementes');
    expect(result.transactions[0].amount).toBe(500);
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

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id });

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

    for (let i = 0; i < 15; i++) {
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

    const result = await sut.execute({
      userId: farmer.id,
      page: 2,
      pageSize: 5,
    });

    expect(result.transactions).toHaveLength(5);
    expect(result.pagination.meta.currentPage).toBe(2);
    expect(result.pagination.meta.totalItems).toBe(15);
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

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id, page: 0 });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should filter transactions by REVENUE type', async () => {
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
    const revenue = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.REVENUE,
      description: 'Venda',
      amount: 1000,
      category,
      date: new Date(),
    });
    const expense = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Despesa',
      amount: 200,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionRepository.save(revenue);
    await inMemoryTransactionRepository.save(expense);

    const result = await sut.execute({
      userId: farmer.id,
      type: TransactionType.REVENUE,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe(TransactionType.REVENUE);
  });

  it('should filter transactions by EXPENSE type', async () => {
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
    const revenue = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.REVENUE,
      description: 'Venda',
      amount: 1000,
      category,
      date: new Date(),
    });
    const expense = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Despesa',
      amount: 200,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionRepository.save(revenue);
    await inMemoryTransactionRepository.save(expense);

    const result = await sut.execute({
      userId: farmer.id,
      type: TransactionType.EXPENSE,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].type).toBe(TransactionType.EXPENSE);
  });

  it('should return all transactions when no type filter is provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const category = TransactionCategory.create({
      name: 'Geral',
      farmId: farm.id,
    });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const revenue = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.REVENUE,
      description: 'Venda',
      amount: 1000,
      category,
      date: new Date(),
    });
    const expense = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Despesa',
      amount: 200,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryTransactionRepository.save(revenue);
    await inMemoryTransactionRepository.save(expense);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.meta.totalItems).toBe(2);
  });
});

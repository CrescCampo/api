import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';
import EditTransaction from 'domain/application/use-cases/transactions/edit-transaction';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryTransactionRepository from '../../repositories/InMemoryTransactionRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class InMemoryTransactionCategoryRepository implements TransactionCategoryRepository {
  items: TransactionCategory[] = [];

  async save(category: TransactionCategory): Promise<void> {
    const index = this.items.findIndex(item => item.id === category.id);
    if (index >= 0) {
      this.items[index] = category;
      return;
    }
    this.items.push(category);
  }

  async saveMany(categories: TransactionCategory[]): Promise<void> {
    for (const category of categories) {
      await this.save(category);
    }
  }

  async findById(id: string): Promise<TransactionCategory | null> {
    return this.items.find(item => item.id === id) ?? null;
  }

  async findByFarmIdSince(): Promise<TransactionCategory[]> {
    return [];
  }

  async findByFarmId(): Promise<TransactionCategory[]> {
    return [];
  }
}

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryTransactionRepository: InMemoryTransactionRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let inMemoryTransactionCategoryRepository: InMemoryTransactionCategoryRepository;
let unitOfWork: InMemoryUnitOfWork;
let sut: EditTransaction;

let farm: ReturnType<typeof Farm.create>;
let farmer: ReturnType<typeof Farmer.create>;
let harvest: ReturnType<typeof Harvest.create>;
let category: ReturnType<typeof TransactionCategory.create>;

describe('EditTransaction', () => {
  beforeEach(async () => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryTransactionRepository = new InMemoryTransactionRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    inMemoryTransactionCategoryRepository =
      new InMemoryTransactionCategoryRepository();
    unitOfWork = new InMemoryUnitOfWork();
    sut = new EditTransaction(
      inMemoryFarmerRepository,
      inMemoryTransactionRepository,
      inMemoryHarvestRepository,
      inMemoryTransactionCategoryRepository,
      unitOfWork,
    );

    farm = Farm.create({});
    farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    category = TransactionCategory.create({
      name: 'Insumos',
      farmId: farm.id,
    });
    harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      expenses: 100,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);
    await inMemoryTransactionCategoryRepository.save(category);
  });

  it('should throw FarmerNotFoundError when farmer does not exist', async () => {
    await expect(
      sut.execute({ userId: 'non-existent', transactionId: 'tx-id' }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    await expect(
      sut.execute({ userId: farmer.id, transactionId: 'non-existent' }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('should update transaction description', async () => {
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryTransactionRepository.save(transaction);

    const result = await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
      description: 'Fertilizer',
    });

    expect(result.transactionId).toBe(transaction.id);
    expect(inMemoryTransactionRepository.items[0].description).toBe(
      'Fertilizer',
    );
  });

  it('should update transaction amount and adjust harvest totals', async () => {
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryTransactionRepository.save(transaction);

    await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
      amount: 250,
    });

    expect(inMemoryTransactionRepository.items[0].amount).toBe(250);
    expect(inMemoryHarvestRepository.items[0].expenses).toBe(250);
  });

  it('should change transaction type and adjust harvest totals', async () => {
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Adjustment',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryTransactionRepository.save(transaction);

    await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
      type: TransactionType.REVENUE,
    });

    expect(inMemoryTransactionRepository.items[0].type).toBe(
      TransactionType.REVENUE,
    );
    expect(inMemoryHarvestRepository.items[0].expenses).toBe(0);
    expect(inMemoryHarvestRepository.items[0].revenue).toBe(100);
  });

  it('should update transaction category', async () => {
    const newCategory = TransactionCategory.create({
      name: 'Fertilizantes',
      farmId: farm.id,
    });
    await inMemoryTransactionCategoryRepository.save(newCategory);

    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryTransactionRepository.save(transaction);

    await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
      categoryId: newCategory.id,
    });

    expect(inMemoryTransactionRepository.items[0].category.id).toBe(
      newCategory.id,
    );
  });

  it('should throw when category belongs to another farm', async () => {
    const otherCategory = TransactionCategory.create({
      name: 'Other',
      farmId: 'other-farm-id',
    });
    await inMemoryTransactionCategoryRepository.save(otherCategory);

    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryTransactionRepository.save(transaction);

    await expect(
      sut.execute({
        userId: farmer.id,
        transactionId: transaction.id,
        categoryId: otherCategory.id,
      }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});

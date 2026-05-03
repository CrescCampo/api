import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';
import DeleteTransaction from 'domain/application/use-cases/transactions/delete-transaction';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryTransactionRepository from '../../repositories/InMemoryTransactionRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';
import InMemoryCultureRepository from '../../repositories/InMemoryCultureRepository';
import InMemoryFarmRepository from '../../repositories/InMemoryFarmRepository';
import InMemoryFeedbackRepository from '../../repositories/InMemoryFeedbackRepository';
import InMemoryOutboxEventRepository from '../../repositories/InMemoryOutboxEventRepository';
import InMemoryTransactionCategoryRepository from '../../repositories/InMemoryTransactionCategoryRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryTransactionRepository: InMemoryTransactionRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let unitOfWork: InMemoryUnitOfWork;
let sut: DeleteTransaction;

describe('DeleteTransaction', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryTransactionRepository = new InMemoryTransactionRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    unitOfWork = new InMemoryUnitOfWork({
      cultures: new InMemoryCultureRepository(),
      farmers: inMemoryFarmerRepository,
      farms: new InMemoryFarmRepository(),
      feedbacks: new InMemoryFeedbackRepository(),
      harvests: inMemoryHarvestRepository,
      outboxEvents: new InMemoryOutboxEventRepository(),
      transactionCategories: new InMemoryTransactionCategoryRepository(),
      transactions: inMemoryTransactionRepository,
    });
    sut = new DeleteTransaction(inMemoryFarmerRepository, unitOfWork);
  });

  it('should throw FarmerNotFoundError without opening a transaction', async () => {
    await expect(
      sut.execute({ userId: 'non-existent', transactionId: 'tx-id' }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);

    expect(unitOfWork.commitCount).toBe(0);
    expect(unitOfWork.rollbackCount).toBe(0);
  });

  it('should rollback when transaction does not exist', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    await expect(
      sut.execute({ userId: farmer.id, transactionId: 'non-existent' }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);

    expect(unitOfWork.commitCount).toBe(0);
    expect(unitOfWork.rollbackCount).toBe(1);
  });

  it('should rollback when transaction belongs to another farm', async () => {
    const farm1 = Farm.create({});
    const farm2 = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm1.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Soja', farmId: farm2.id });
    const category = TransactionCategory.create({
      name: 'Insumos',
      farmId: farm2.id,
    });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm2.id,
      expenses: 100,
    });
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 100,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);
    await inMemoryTransactionRepository.save(transaction);

    await expect(
      sut.execute({ userId: farmer.id, transactionId: transaction.id }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);

    expect(unitOfWork.commitCount).toBe(0);
    expect(unitOfWork.rollbackCount).toBe(1);
  });

  it('should delete an expense transaction and reverse harvest totals', async () => {
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
      expenses: 200,
    });
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.EXPENSE,
      description: 'Seeds',
      amount: 200,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);
    await inMemoryTransactionRepository.save(transaction);

    const result = await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
    });

    expect(result.transactionId).toBe(transaction.id);
    expect(inMemoryTransactionRepository.items).toHaveLength(0);
    expect(inMemoryHarvestRepository.items[0].expenses).toBe(0);
    expect(unitOfWork.commitCount).toBe(1);
    expect(unitOfWork.rollbackCount).toBe(0);
  });

  it('should delete a revenue transaction and reverse harvest totals', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Milho', farmId: farm.id });
    const category = TransactionCategory.create({
      name: 'Vendas',
      farmId: farm.id,
    });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      revenue: 500,
    });
    const transaction = Transaction.create({
      harvestId: harvest.id,
      type: TransactionType.REVENUE,
      description: 'Sale',
      amount: 500,
      category,
      date: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);
    await inMemoryTransactionRepository.save(transaction);

    await sut.execute({
      userId: farmer.id,
      transactionId: transaction.id,
    });

    expect(inMemoryHarvestRepository.items[0].revenue).toBe(0);
    expect(unitOfWork.commitCount).toBe(1);
    expect(unitOfWork.rollbackCount).toBe(0);
  });
});

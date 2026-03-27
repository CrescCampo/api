import Farmer from 'domain/enterprise/entities/Farmer';
import Farm from 'domain/enterprise/entities/Farm';
import Culture from 'domain/enterprise/entities/Culture';
import Harvest from 'domain/enterprise/entities/Harvest';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import OutboxEventRepository, {
  OutboxEventRecord,
} from 'domain/application/repositories/OutboxEventRepository';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import AppPushUseCase, { OutboxEventEntity, OutboxEventType } from 'domain/application/use-cases/app/push';

class InMemoryCultureRepository implements CultureRepository {
  items: Culture[] = [];

  async save(culture: Culture): Promise<void> {
    const index = this.items.findIndex(item => item.id === culture.id);

    if (index >= 0) {
      this.items[index] = culture;
      return;
    }

    this.items.push(culture);
  }

  async findById(id: string): Promise<Culture | null> {
    return this.items.find(item => item.id === id) ?? null;
  }

  async findAll(): Promise<Culture[]> {
    return this.items;
  }

  async findByFarmId(farmId: string): Promise<Culture[]> {
    return this.items.filter(item => item.farmId === farmId);
  }
}

class InMemoryHarvestRepository implements HarvestRepository {
  items: Harvest[] = [];

  async save(harvest: Harvest): Promise<void> {
    const index = this.items.findIndex(item => item.id === harvest.id);

    if (index >= 0) {
      this.items[index] = harvest;
      return;
    }

    this.items.push(harvest);
  }

  async exists(id: string): Promise<boolean> {
    return this.items.some(item => item.id === id);
  }

  async findById(id: string): Promise<Harvest | null> {
    return this.items.find(item => item.id === id) ?? null;
  }

  async findSinceByFarmId(): Promise<Harvest[]> {
    return [];
  }

  async findActiveByFarmId(): Promise<Harvest[]> {
    return [];
  }

  async findRecentByFarmId(): Promise<Harvest[]> {
    return [];
  }

  async findByFarmIdPaginated(): Promise<Harvest[]> {
    return [];
  }

  async countByFarmId(): Promise<number> {
    return 0;
  }

  async getTotalsByFarmId(): Promise<{
    totalRevenue: number;
    totalExpenses: number;
  }> {
    return { totalRevenue: 0, totalExpenses: 0 };
  }
}

class InMemoryTransactionCategoryRepository
  implements TransactionCategoryRepository
{
  items: TransactionCategory[] = [];

  async save(category: TransactionCategory): Promise<void> {
    const index = this.items.findIndex(item => item.id === category.id);

    if (index >= 0) {
      this.items[index] = category;
      return;
    }

    this.items.push(category);
  }

  async findById(id: string): Promise<TransactionCategory | null> {
    return this.items.find(item => item.id === id) ?? null;
  }

  async findByFarmIdSince(): Promise<TransactionCategory[]> {
    return [];
  }

  async findByFarmId(farmId: string): Promise<TransactionCategory[]> {
    return this.items.filter(item => item.farmId === farmId);
  }
}

class InMemoryTransactionRepository implements TransactionRepository {
  items: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.items.push(transaction);
  }

  async findByFarmIdSince(): Promise<Transaction[]> {
    return [];
  }

  async findByFarmIdRecent(): Promise<Transaction[]> {
    return [];
  }

  async findByFarmIdPaginated(): Promise<Transaction[]> {
    return [];
  }

  async countByFarmId(): Promise<number> {
    return 0;
  }

  async findByHarvestIdPaginated(): Promise<Transaction[]> {
    return [];
  }

  async countByHarvestId(): Promise<number> {
    return 0;
  }
}

class InMemoryOutboxEventRepository implements OutboxEventRepository {
  items: OutboxEventRecord[] = [];

  async exists(id: string): Promise<boolean> {
    return this.items.some(item => item.id === id);
  }

  async save(event: OutboxEventRecord): Promise<void> {
    this.items.push(event);
  }
}

describe('AppPushUseCase', () => {
  it('should not add transaction to a finished harvest', async () => {
    const farmerRepository = new InMemoryFarmerRepository();
    const cultureRepository = new InMemoryCultureRepository();
    const harvestRepository = new InMemoryHarvestRepository();
    const transactionCategoryRepository =
      new InMemoryTransactionCategoryRepository();
    const transactionRepository = new InMemoryTransactionRepository();
    const outboxEventRepository = new InMemoryOutboxEventRepository();

    const sut = new AppPushUseCase(
      farmerRepository,
      cultureRepository,
      harvestRepository,
      transactionCategoryRepository,
      transactionRepository,
      outboxEventRepository,
    );

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Joao',
      email: 'joao@example.com',
      password: 'hashed-password',
      farmId: farm.id,
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      farmId: farm.id,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T00:00:00.000Z'),
    });
    const category = TransactionCategory.create({
      name: 'Venda',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);
    await cultureRepository.save(culture);
    await harvestRepository.save(harvest);
    await transactionCategoryRepository.save(category);

    const outboxEvent = {
      id: 'outbox-1',
      event: OutboxEventType.CREATE,
      entity: OutboxEventEntity.TRANSACTION,
      payload: JSON.stringify({
        id: 'tx-1',
        harvestId: harvest.id,
        type: TransactionType.REVENUE,
        description: 'Venda de soja',
        amount: 1000,
        categoryId: category.id,
        date: new Date('2025-06-01T00:00:00.000Z').getTime(),
      }),
      createdAt: new Date('2025-06-01T10:00:00.000Z').getTime(),
    };

    await expect(
      sut.execute(farmer.id, { outbox: [outboxEvent] }),
    ).rejects.toThrow('Cannot apply transaction to finished harvest');

    expect(transactionRepository.items).toHaveLength(0);
    expect(outboxEventRepository.items).toHaveLength(0);
    expect(harvest.revenue).toBe(0);
    expect(harvest.expenses).toBe(0);
  });
});

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
import AppPushUseCase, {
  OutboxEventEntity,
  OutboxEventType,
} from 'domain/application/use-cases/app/push';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

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

  async findByFarmId(farmId: string): Promise<TransactionCategory[]> {
    return this.items.filter(item => item.farmId === farmId);
  }
}

class InMemoryTransactionRepository implements TransactionRepository {
  items: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.items.push(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.items.find(item => item.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(item => item.id !== id);
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

function makeSut() {
  const farmerRepository = new InMemoryFarmerRepository();
  const cultureRepository = new InMemoryCultureRepository();
  const harvestRepository = new InMemoryHarvestRepository();
  const transactionCategoryRepository =
    new InMemoryTransactionCategoryRepository();
  const transactionRepository = new InMemoryTransactionRepository();
  const outboxEventRepository = new InMemoryOutboxEventRepository();
  const unitOfWork = new InMemoryUnitOfWork();

  const sut = new AppPushUseCase(
    farmerRepository,
    cultureRepository,
    harvestRepository,
    transactionCategoryRepository,
    transactionRepository,
    outboxEventRepository,
    unitOfWork,
  );

  return {
    sut,
    farmerRepository,
    cultureRepository,
    harvestRepository,
    transactionCategoryRepository,
    transactionRepository,
    outboxEventRepository,
    unitOfWork,
  };
}

describe('AppPushUseCase', () => {
  it('should throw when farmer does not exist', async () => {
    const { sut } = makeSut();

    await expect(sut.execute('non-existent', { outbox: [] })).rejects.toThrow(
      'Farmer non-existent not found',
    );
  });

  it('should throw on invalid JSON payload', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.CULTURE,
            payload: 'invalid json {{{',
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Invalid JSON payload for outbox event event-1');
  });

  it('should throw on unsupported outbox event type', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: 'delete' as OutboxEventType,
            entity: OutboxEventEntity.CULTURE,
            payload: JSON.stringify({ id: 'c-1', name: 'Soja' }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Unsupported outbox event type delete');
  });

  it('should throw on unsupported outbox entity', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: 'unknown_entity' as OutboxEventEntity,
            payload: JSON.stringify({ id: 'x-1', name: 'Test' }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Unsupported outbox entity unknown_entity');
  });

  it('should throw on invalid culture payload', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.CULTURE,
            payload: JSON.stringify({ id: 'c-1' }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Invalid culture payload for outbox event event-1');
  });

  it('should throw on invalid harvest payload', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.HARVEST,
            payload: JSON.stringify({ id: 'h-1', name: 'Safra' }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Invalid harvest payload for outbox event event-1');
  });

  it('should throw on invalid transaction payload', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.TRANSACTION,
            payload: JSON.stringify({ id: 'tx-1', harvestId: 'h-1' }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Invalid transaction payload for outbox event event-1');
  });

  it('should throw on invalid transaction category payload', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.TRANSACTION_CATEGORY,
            payload: JSON.stringify({ id: 42 }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow(
      'Invalid transaction category payload for outbox event event-1',
    );
  });

  it('should skip duplicate event IDs in the same batch', async () => {
    const { sut, farmerRepository, cultureRepository, outboxEventRepository } =
      makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    const duplicateEvent = {
      id: 'event-1',
      event: OutboxEventType.CREATE,
      entity: OutboxEventEntity.CULTURE,
      payload: JSON.stringify({ id: 'c-1', name: 'Soja' }),
      createdAt: Date.now(),
    };

    await sut.execute(farmer.id, {
      outbox: [duplicateEvent, duplicateEvent],
    });

    expect(cultureRepository.items).toHaveLength(1);
    expect(outboxEventRepository.items).toHaveLength(1);
  });

  it('should skip already processed events', async () => {
    const { sut, farmerRepository, cultureRepository, outboxEventRepository } =
      makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);
    await outboxEventRepository.save({
      id: 'event-1',
      event: OutboxEventType.CREATE,
      entity: OutboxEventEntity.CULTURE,
      createdAt: Date.now(),
    });

    await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.CULTURE,
          payload: JSON.stringify({ id: 'c-1', name: 'Soja' }),
          createdAt: Date.now(),
        },
      ],
    });

    expect(cultureRepository.items).toHaveLength(0);
    expect(outboxEventRepository.items).toHaveLength(1);
  });

  it('should create a culture and save it to the repository', async () => {
    const { sut, farmerRepository, cultureRepository, outboxEventRepository } =
      makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.CULTURE,
          payload: JSON.stringify({ id: 'culture-id-1', name: 'Soja' }),
          createdAt: Date.now(),
        },
      ],
    });

    expect(cultureRepository.items).toHaveLength(1);
    expect(cultureRepository.items[0].id).toBe('culture-id-1');
    expect(cultureRepository.items[0].name).toBe('Soja');
    expect(cultureRepository.items[0].farmId).toBe(farm.id);
    expect(outboxEventRepository.items).toHaveLength(1);
    expect(outboxEventRepository.items[0].id).toBe('event-1');
  });

  it('should create a transaction category and save it to the repository', async () => {
    const {
      sut,
      farmerRepository,
      transactionCategoryRepository,
      outboxEventRepository,
    } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.TRANSACTION_CATEGORY,
          payload: JSON.stringify({ id: 'cat-id-1', name: 'Insumos' }),
          createdAt: Date.now(),
        },
      ],
    });

    expect(transactionCategoryRepository.items).toHaveLength(1);
    expect(transactionCategoryRepository.items[0].id).toBe('cat-id-1');
    expect(transactionCategoryRepository.items[0].name).toBe('Insumos');
    expect(transactionCategoryRepository.items[0].farmId).toBe(farm.id);
    expect(outboxEventRepository.items).toHaveLength(1);
  });

  it('should create a harvest and save it to the repository', async () => {
    const {
      sut,
      farmerRepository,
      cultureRepository,
      harvestRepository,
      outboxEventRepository,
    } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });

    await farmerRepository.save(farmer);
    await cultureRepository.save(culture);

    const startDate = new Date('2025-01-01T00:00:00.000Z').getTime();

    await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.HARVEST,
          payload: JSON.stringify({
            id: 'harvest-id-1',
            name: 'Safra 2025',
            cultureId: culture.id,
            startDate,
            revenue: 0,
            expenses: 0,
          }),
          createdAt: Date.now(),
        },
      ],
    });

    expect(harvestRepository.items).toHaveLength(1);
    expect(harvestRepository.items[0].id).toBe('harvest-id-1');
    expect(harvestRepository.items[0].name).toBe('Safra 2025');
    expect(harvestRepository.items[0].culture.id).toBe(culture.id);
    expect(harvestRepository.items[0].startDate.getTime()).toBe(startDate);
    expect(outboxEventRepository.items).toHaveLength(1);
  });

  it('should throw when culture for harvest is not found', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.HARVEST,
            payload: JSON.stringify({
              id: 'harvest-id-1',
              name: 'Safra 2025',
              cultureId: 'non-existent-culture',
              startDate: Date.now(),
              revenue: 0,
              expenses: 0,
            }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow('Culture non-existent-culture not found for harvest');
  });

  it('should create a transaction and apply it to the harvest', async () => {
    const {
      sut,
      farmerRepository,
      cultureRepository,
      harvestRepository,
      transactionCategoryRepository,
      transactionRepository,
      outboxEventRepository,
    } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      farmId: farm.id,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
    });
    const category = TransactionCategory.create({
      name: 'Vendas',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);
    await cultureRepository.save(culture);
    await harvestRepository.save(harvest);
    await transactionCategoryRepository.save(category);

    await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.TRANSACTION,
          payload: JSON.stringify({
            id: 'tx-id-1',
            harvestId: harvest.id,
            type: TransactionType.REVENUE,
            description: 'Venda de soja',
            amount: 1000,
            categoryId: category.id,
            date: new Date('2025-06-01T00:00:00.000Z').getTime(),
          }),
          createdAt: new Date('2025-06-01T10:00:00.000Z').getTime(),
        },
      ],
    });

    expect(transactionRepository.items).toHaveLength(1);
    expect(transactionRepository.items[0].id).toBe('tx-id-1');
    expect(transactionRepository.items[0].amount).toBe(1000);
    expect(harvestRepository.items[0].revenue).toBe(1000);
    expect(outboxEventRepository.items).toHaveLength(1);
  });

  it('should throw when harvest for transaction is not found', async () => {
    const { sut, farmerRepository, transactionCategoryRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });
    const category = TransactionCategory.create({
      name: 'Vendas',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);
    await transactionCategoryRepository.save(category);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.TRANSACTION,
            payload: JSON.stringify({
              id: 'tx-id-1',
              harvestId: 'non-existent-harvest',
              type: TransactionType.REVENUE,
              description: 'Venda',
              amount: 500,
              categoryId: category.id,
              date: Date.now(),
            }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow(
      'Harvest non-existent-harvest not found for transaction event-1',
    );
  });

  it('should throw when transaction category is not found', async () => {
    const { sut, farmerRepository, cultureRepository, harvestRepository } =
      makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      farmId: farm.id,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
    });

    await farmerRepository.save(farmer);
    await cultureRepository.save(culture);
    await harvestRepository.save(harvest);

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
            id: 'event-1',
            event: OutboxEventType.CREATE,
            entity: OutboxEventEntity.TRANSACTION,
            payload: JSON.stringify({
              id: 'tx-id-1',
              harvestId: harvest.id,
              type: TransactionType.EXPENSE,
              description: 'Despesa',
              amount: 300,
              categoryId: 'non-existent-category',
              date: Date.now(),
            }),
            createdAt: Date.now(),
          },
        ],
      }),
    ).rejects.toThrow(
      'Transaction category non-existent-category not found for transaction event-1',
    );
  });

  it('should not add transaction to a finished harvest', async () => {
    const {
      sut,
      farmerRepository,
      cultureRepository,
      harvestRepository,
      transactionCategoryRepository,
      transactionRepository,
      outboxEventRepository,
    } = makeSut();

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

    await expect(
      sut.execute(farmer.id, {
        outbox: [
          {
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
          },
        ],
      }),
    ).rejects.toThrow('Cannot apply transaction to finished harvest');

    expect(transactionRepository.items).toHaveLength(0);
    expect(outboxEventRepository.items).toHaveLength(0);
    expect(harvest.revenue).toBe(0);
    expect(harvest.expenses).toBe(0);
  });

  it('should return parsed events for a successful batch', async () => {
    const { sut, farmerRepository } = makeSut();

    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'hashed',
      farmId: farm.id,
    });

    await farmerRepository.save(farmer);

    const result = await sut.execute(farmer.id, {
      outbox: [
        {
          id: 'event-1',
          event: OutboxEventType.CREATE,
          entity: OutboxEventEntity.CULTURE,
          payload: JSON.stringify({ id: 'c-1', name: 'Soja' }),
          createdAt: Date.now(),
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('event-1');
    expect(result[0].entity).toBe(OutboxEventEntity.CULTURE);
  });
});

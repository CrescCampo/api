import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionType from 'domain/enterprise/enums/TransactionType';

interface TransactionTombstone {
  id: string;
  farmId: string;
  deletedAt: Date;
}

export default class InMemoryTransactionRepository implements TransactionRepository {
  items: Transaction[] = [];

  tombstones: TransactionTombstone[] = [];

  save(transaction: Transaction): Promise<void> {
    const existingIndex = this.items.findIndex(
      item => item.id === transaction.id,
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = transaction;
      return Promise.resolve();
    }

    this.items.push(transaction);
    return Promise.resolve();
  }

  findById(id: string): Promise<Transaction | null> {
    const transaction = this.items.find(item => item.id === id);
    return Promise.resolve(transaction ?? null);
  }

  delete(id: string, farmId: string): Promise<void> {
    this.items = this.items.filter(item => item.id !== id);
    this.tombstones.push({ id, farmId, deletedAt: new Date() });
    return Promise.resolve();
  }

  findByFarmIdSince(farmId: string, since: Date): Promise<Transaction[]> {
    const transactions = this.items.filter(
      item =>
        item.category.farmId === farmId &&
        (item.createdAt >= since ||
          (item.updatedAt !== null && item.updatedAt >= since)),
    );
    return Promise.resolve(transactions);
  }

  findDeletedIdsByFarmIdSince(farmId: string, since: Date): Promise<string[]> {
    const ids = this.tombstones
      .filter(item => item.farmId === farmId && item.deletedAt >= since)
      .map(item => item.id);
    return Promise.resolve(ids);
  }

  findByFarmIdRecent(farmId: string, limit: number): Promise<Transaction[]> {
    const transactions = this.items
      .filter(item => item.category.farmId === farmId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
    return Promise.resolve(transactions);
  }

  findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
    type?: TransactionType,
  ): Promise<Transaction[]> {
    let transactions = this.items.filter(
      item => item.category.farmId === farmId,
    );
    if (type) {
      transactions = transactions.filter(item => item.type === type);
    }
    return Promise.resolve(
      transactions
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(offset, offset + limit),
    );
  }

  countByFarmId(farmId: string, type?: TransactionType): Promise<number> {
    let transactions = this.items.filter(
      item => item.category.farmId === farmId,
    );
    if (type) {
      transactions = transactions.filter(item => item.type === type);
    }
    return Promise.resolve(transactions.length);
  }

  findByHarvestIdPaginated(
    harvestId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]> {
    const transactions = this.items
      .filter(item => item.harvestId === harvestId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(offset, offset + limit);
    return Promise.resolve(transactions);
  }

  countByHarvestId(harvestId: string): Promise<number> {
    const count = this.items.filter(
      item => item.harvestId === harvestId,
    ).length;
    return Promise.resolve(count);
  }
}

import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';

export default class InMemoryTransactionCategoryRepository implements TransactionCategoryRepository {
  items: TransactionCategory[] = [];

  async save(category: TransactionCategory): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === category.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = category;
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

  async findByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<TransactionCategory[]> {
    return this.items.filter(
      item => item.farmId === farmId && item.createdAt >= since,
    );
  }

  async findByFarmId(farmId: string): Promise<TransactionCategory[]> {
    return this.items.filter(item => item.farmId === farmId);
  }
}

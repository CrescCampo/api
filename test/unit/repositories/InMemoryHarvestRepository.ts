import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import Harvest from 'domain/enterprise/entities/Harvest';

export default class InMemoryHarvestRepository implements HarvestRepository {
  items: Harvest[] = [];

  save(harvest: Harvest): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === harvest.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = harvest;
      return Promise.resolve();
    }

    this.items.push(harvest);
    return Promise.resolve();
  }

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.items.some(item => item.id === id));
  }

  findById(id: string): Promise<Harvest | null> {
    const harvest = this.items.find(item => item.id === id);
    return Promise.resolve(harvest ?? null);
  }

  findSinceByFarmId(farmId: string, since: Date): Promise<Harvest[]> {
    const harvests = this.items.filter(
      item => item.farmId === farmId && item.createdAt >= since,
    );
    return Promise.resolve(harvests);
  }

  findActiveByFarmId(farmId: string): Promise<Harvest[]> {
    const harvests = this.items.filter(
      item => item.farmId === farmId && !item.isFinished,
    );
    return Promise.resolve(harvests);
  }

  findRecentByFarmId(farmId: string, limit: number): Promise<Harvest[]> {
    const harvests = this.items
      .filter(item => item.farmId === farmId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return Promise.resolve(harvests);
  }

  findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
    search?: string,
    active?: boolean,
  ): Promise<Harvest[]> {
    let harvests = this.items.filter(item => item.farmId === farmId);
    if (search) {
      harvests = harvests.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (active !== undefined) {
      harvests = harvests.filter(item =>
        active ? !item.isFinished : item.isFinished,
      );
    }
    return Promise.resolve(
      harvests
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit),
    );
  }

  countByFarmId(
    farmId: string,
    search?: string,
    active?: boolean,
  ): Promise<number> {
    let harvests = this.items.filter(item => item.farmId === farmId);
    if (search) {
      harvests = harvests.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (active !== undefined) {
      harvests = harvests.filter(item =>
        active ? !item.isFinished : item.isFinished,
      );
    }
    return Promise.resolve(harvests.length);
  }

  getTotalsByFarmId(
    farmId: string,
  ): Promise<{ totalRevenue: number; totalExpenses: number }> {
    const harvests = this.items.filter(item => item.farmId === farmId);
    const totalRevenue = harvests.reduce((sum, h) => sum + h.revenue, 0);
    const totalExpenses = harvests.reduce((sum, h) => sum + h.expenses, 0);
    return Promise.resolve({ totalRevenue, totalExpenses });
  }
}

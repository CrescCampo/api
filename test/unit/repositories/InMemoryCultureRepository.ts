import CultureRepository from 'domain/application/repositories/CultureRepository';
import Culture from 'domain/enterprise/entities/Culture';

export default class InMemoryCultureRepository implements CultureRepository {
  items: Culture[] = [];

  async save(culture: Culture) {
    const existingIndex = this.items.findIndex(item => item.id === culture.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = culture;
      return Promise.resolve();
    }

    this.items.push(culture);
    return Promise.resolve();
  }

  async findById(id: string) {
    return this.items.find(item => item.id === id) ?? null;
  }

  async findAll() {
    return this.items;
  }

  async findByFarmId(farmId: string) {
    return this.items.filter(item => item.farmId === farmId);
  }
}

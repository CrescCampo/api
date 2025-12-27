import FarmRepository from 'domain/application/repositories/FarmRepository';
import Farm from 'domain/enterprise/entities/Farm';

export default class InMemoryFarmRepository implements FarmRepository {
  items: Farm[] = [];

  async save(farm: Farm) {
    const existingIndex = this.items.findIndex(item => item.id === farm.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = farm;
      return Promise.resolve();
    }

    this.items.push(farm);
    return Promise.resolve();
  }
}

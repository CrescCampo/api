import { IFarmRepository } from 'domain/application/repositories/IFarmRepository';
import Farm from 'domain/enterprise/entities/Farm';

export default class InMemoryFarmRepository implements IFarmRepository {
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

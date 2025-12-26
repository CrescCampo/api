import { IFarmerRepository } from 'domain/application/repositories/IFarmerRepository';
import Farmer from 'domain/enterprise/entities/Farmer';

export default class InMemoryFarmerRepository implements IFarmerRepository {
  items: Farmer[] = [];

  save(farmer: Farmer): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === farmer.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = farmer;
      return Promise.resolve();
    }

    this.items.push(farmer);
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<Farmer | null> {
    const existingFarmer = this.items.find(user => user.email === email);

    if (!existingFarmer) {
      return Promise.resolve(null);
    }

    return Promise.resolve(existingFarmer);
  }
}

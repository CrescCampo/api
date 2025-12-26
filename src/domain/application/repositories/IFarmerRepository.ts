import Farmer from 'domain/enterprise/entities/Farmer';

export interface IFarmerRepository {
  save(farmer: Farmer): Promise<void>;
  findByEmail(email: string): Promise<Farmer | null>;
}

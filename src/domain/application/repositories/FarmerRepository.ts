import Farmer from 'domain/enterprise/entities/Farmer';

export default abstract class FarmerRepository {
  abstract save(farmer: Farmer): Promise<void>;

  abstract findByEmail(email: string): Promise<Farmer | null>;

  abstract findById(id: string): Promise<Farmer | null>;

  abstract findByPhone(phone: string): Promise<Farmer | null>;
}

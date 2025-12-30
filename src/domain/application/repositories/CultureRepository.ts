import Culture from 'domain/enterprise/entities/Culture';

export default abstract class CultureRepository {
  abstract save(culture: Culture): Promise<void>;

  abstract findById(id: string): Promise<Culture | null>;

  abstract findAll(): Promise<Culture[]>;

  abstract findByFarmId(farmId: string): Promise<Culture[]>;
}

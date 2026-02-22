import Harvest from 'domain/enterprise/entities/Harvest';

export default abstract class HarvestRepository {
  abstract save(harvest: Harvest): Promise<void>;

  abstract exists(id: string): Promise<boolean>;

  abstract findById(id: string): Promise<Harvest | null>;

  abstract findSinceByFarmId(farmId: string, since: Date): Promise<Harvest[]>;

  abstract findActiveByFarmId(farmId: string): Promise<Harvest[]>;

  abstract findRecentByFarmId(
    farmId: string,
    limit: number,
  ): Promise<Harvest[]>;

  abstract findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
    search?: string,
    active?: boolean,
  ): Promise<Harvest[]>;

  abstract countByFarmId(
    farmId: string,
    search?: string,
    active?: boolean,
  ): Promise<number>;

  abstract getTotalsByFarmId(farmId: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
  }>;
}

import Transaction from 'domain/enterprise/entities/Transaction';

export default abstract class TransactionRepository {
  abstract save(transaction: Transaction): Promise<void>;

  abstract findByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<Transaction[]>;

  abstract findByFarmIdRecent(
    farmId: string,
    limit: number,
  ): Promise<Transaction[]>;

  abstract findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]>;

  abstract countByFarmId(farmId: string): Promise<number>;

  abstract findByHarvestIdPaginated(
    harvestId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]>;

  abstract countByHarvestId(harvestId: string): Promise<number>;
}

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

  abstract countByFarmId(farmId: string): Promise<number>;
}

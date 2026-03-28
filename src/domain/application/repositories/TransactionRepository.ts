import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export default abstract class TransactionRepository {
  abstract save(transaction: Transaction): Promise<void>;

  abstract findById(id: string): Promise<Transaction | null>;

  abstract delete(id: string): Promise<void>;

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
    type?: TransactionType,
  ): Promise<Transaction[]>;

  abstract countByFarmId(
    farmId: string,
    type?: TransactionType,
  ): Promise<number>;

  abstract findByHarvestIdPaginated(
    harvestId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]>;

  abstract countByHarvestId(harvestId: string): Promise<number>;
}

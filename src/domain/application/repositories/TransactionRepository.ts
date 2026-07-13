import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export const TRANSACTION_TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export default abstract class TransactionRepository {
  abstract save(transaction: Transaction): Promise<void>;

  abstract findById(id: string): Promise<Transaction | null>;

  abstract delete(id: string, farmId: string): Promise<void>;

  abstract findByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<Transaction[]>;

  abstract findDeletedIdsByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<string[]>;

  abstract purgeDeletedBefore(cutoff: Date): Promise<void>;

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

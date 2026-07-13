import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import TransactionRepository, {
  TRANSACTION_TOMBSTONE_RETENTION_MS,
} from 'domain/application/repositories/TransactionRepository';

@Injectable()
export default class TombstonePurgeService {
  private readonly logger = new Logger(TombstonePurgeService.name);

  constructor(private readonly transactionRepository: TransactionRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purge(): Promise<void> {
    const cutoff = new Date(Date.now() - TRANSACTION_TOMBSTONE_RETENTION_MS);

    await this.transactionRepository.purgeDeletedBefore(cutoff);

    this.logger.log(
      `Purged transaction tombstones older than ${cutoff.toISOString()}`,
    );
  }
}

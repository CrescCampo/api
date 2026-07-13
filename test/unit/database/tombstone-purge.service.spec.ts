import TombstonePurgeService from 'infra/database/tombstone-purge.service';
import { TRANSACTION_TOMBSTONE_RETENTION_MS } from 'domain/application/repositories/TransactionRepository';
import InMemoryTransactionRepository from '../repositories/InMemoryTransactionRepository';

describe('TombstonePurgeService', () => {
  it('should purge tombstones older than the retention window', async () => {
    const repository = new InMemoryTransactionRepository();
    const sut = new TombstonePurgeService(repository);
    const now = Date.now();

    repository.tombstones.push(
      {
        id: 'old-tombstone',
        farmId: 'farm-1',
        deletedAt: new Date(
          now - TRANSACTION_TOMBSTONE_RETENTION_MS - 24 * 60 * 60 * 1000,
        ),
      },
      {
        id: 'recent-tombstone',
        farmId: 'farm-1',
        deletedAt: new Date(now - 24 * 60 * 60 * 1000),
      },
    );

    await sut.purge();

    expect(repository.tombstones.map(item => item.id)).toEqual([
      'recent-tombstone',
    ]);
  });
});

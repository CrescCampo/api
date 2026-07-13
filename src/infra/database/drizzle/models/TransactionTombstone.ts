import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import FarmModel from './Farm';

export const TransactionTombstoneModel = pgTable(
  'transaction_tombstones',
  {
    id: text().primaryKey(),
    farmId: text()
      .notNull()
      .references(() => FarmModel.id),
    deletedAt: timestamp({ mode: 'date' }).notNull(),
  },
  table => [index('transaction_tombstone_farm_idx').on(table.farmId)],
);

export default TransactionTombstoneModel;

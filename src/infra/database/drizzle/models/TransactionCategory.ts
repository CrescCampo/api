import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import FarmModel from './Farm';

export const TransactionCategoryModel = pgTable(
  'transaction_categories',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    farmId: text()
      .notNull()
      .references(() => FarmModel.id),
    createdAt: timestamp({ mode: 'date' }).notNull(),
  },
  table => [index('transaction_category_farm_idx').on(table.farmId)],
);

export default TransactionCategoryModel;

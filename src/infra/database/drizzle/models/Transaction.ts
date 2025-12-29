import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import HarvestModel from './Harvest';
import TransactionCategoryModel from './TransactionCategory';

export const TransactionModel = pgTable(
  'transactions',
  {
    id: text().primaryKey(),
    harvestId: text()
      .notNull()
      .references(() => HarvestModel.id),
    categoryId: text()
      .notNull()
      .references(() => TransactionCategoryModel.id),
    type: text().notNull(),
    description: text().notNull(),
    amount: doublePrecision().notNull(),
    date: timestamp({ mode: 'date' }).notNull(),
    createdAt: timestamp({ mode: 'date' }).notNull(),
  },
  table => [
    index('transaction_harvest_idx').on(table.harvestId),
    index('transaction_category_idx').on(table.categoryId),
  ],
);

export default TransactionModel;

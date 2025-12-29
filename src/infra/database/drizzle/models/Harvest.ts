import { pgTable, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import CultureModel from './Culture';

export const HarvestModel = pgTable('harvests', {
  id: text().primaryKey(),
  name: text().notNull(),
  cultureId: text()
    .notNull()
    .references(() => CultureModel.id),
  startDate: timestamp({ mode: 'date' }).notNull(),
  endDate: timestamp({ mode: 'date' }),
  revenue: doublePrecision().notNull(),
  expenses: doublePrecision().notNull(),
  createdAt: timestamp({ mode: 'date' }).notNull(),
  updatedAt: timestamp({ mode: 'date' }),
});

export default HarvestModel;

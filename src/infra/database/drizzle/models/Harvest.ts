import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import CultureModel from './Culture';
import FarmModel from './Farm';

export const HarvestModel = pgTable(
  'harvests',
  {
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
    farmId: text()
      .notNull()
      .references(() => FarmModel.id),
  },
  table => [index('harvest_farm_idx').on(table.farmId)],
);

export default HarvestModel;

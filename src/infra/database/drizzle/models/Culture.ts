import { index, pgTable, text } from 'drizzle-orm/pg-core';
import FarmModel from './Farm';

export const CultureModel = pgTable(
  'cultures',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    farmId: text()
      .notNull()
      .references(() => FarmModel.id),
  },
  table => [index('culture_farm_idx').on(table.farmId)],
);

export default CultureModel;

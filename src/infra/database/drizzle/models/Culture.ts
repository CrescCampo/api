import { pgTable, text } from 'drizzle-orm/pg-core';

export const CultureModel = pgTable('cultures', {
  id: text().primaryKey(),
  name: text().notNull(),
});

export default CultureModel;

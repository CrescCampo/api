import { index, pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

export const FeedbackModel = pgTable(
  'feedbacks',
  {
    id: text().primaryKey(),
    farmerId: text()
      .notNull()
      .references(() => FarmerModel.id),
    rating: integer().notNull(),
    description: text().notNull(),
    category: text().notNull(),
    createdAt: timestamp({ mode: 'date' }).notNull(),
  },
  table => [index('feedback_farmer_idx').on(table.farmerId)],
);

export default FeedbackModel;

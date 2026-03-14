import { relations } from 'drizzle-orm';
import { date, text, pgTable, boolean, index } from 'drizzle-orm/pg-core';
import FarmModel from './Farm';
import FeedbackModel from './Feedback';

export const FarmerModel = pgTable(
  'farmers',
  {
    id: text().primaryKey(),
    farmId: text().notNull(),
    name: text().notNull(),
    email: text().unique().notNull(),
    password: text().notNull(),
    phone: text(),
    disabled: boolean().default(false).notNull(),
    createdAt: date({ mode: 'date' }),
    updatedAt: date({ mode: 'date' }),
    lastLogin: date({ mode: 'date' }),
  },
  table => [index('farmer_email_idx').on(table.email)],
);

export const FarmerRelations = relations(FarmerModel, ({ one, many }) => ({
  farm: one(FarmModel, {
    fields: [FarmerModel.farmId],
    references: [FarmModel.id],
  }),
  feedbacks: many(FeedbackModel),
}));

export default FarmerModel;

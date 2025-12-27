import { relations } from 'drizzle-orm';
import { text, pgTable } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

export const FarmModel = pgTable('farms', {
  id: text().primaryKey(),
});

export const FarmRelations = relations(FarmModel, ({ many }) => ({
  farmers: many(FarmerModel),
}));

export default FarmModel;

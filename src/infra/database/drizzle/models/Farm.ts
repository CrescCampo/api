import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';
import InviteModel from './Invite';

export const farmAccessStatus = pgEnum('farm_access_status', [
  'courtesy',
  'suspended',
]);

export const FarmModel = pgTable('farms', {
  id: text().primaryKey(),
  accessStatus: farmAccessStatus().default('courtesy').notNull(),
  inviteId: text().references(() => InviteModel.id),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }),
});

export const FarmRelations = relations(FarmModel, ({ many, one }) => ({
  farmers: many(FarmerModel),
  invite: one(InviteModel, {
    fields: [FarmModel.inviteId],
    references: [InviteModel.id],
  }),
}));

export default FarmModel;

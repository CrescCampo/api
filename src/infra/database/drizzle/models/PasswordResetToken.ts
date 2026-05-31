import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

const PasswordResetTokenModel = pgTable(
  'password_reset_tokens',
  {
    id: text().primaryKey(),
    farmerId: text().notNull(),
    tokenHash: text().notNull().unique(),
    ttlMinutes: integer().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    requestIp: text(),
    userAgent: text(),
  },
  table => [index('prt_farmer_idx').on(table.farmerId)],
);

export const PasswordResetTokenRelations = relations(
  PasswordResetTokenModel,
  ({ one }) => ({
    farmer: one(FarmerModel, {
      fields: [PasswordResetTokenModel.farmerId],
      references: [FarmerModel.id],
    }),
  }),
);

export default PasswordResetTokenModel;

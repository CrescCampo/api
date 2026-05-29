import { relations } from 'drizzle-orm';
import { date, index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

const PasswordResetTokenModel = pgTable(
  'password_reset_tokens',
  {
    id: text().primaryKey(),
    farmerId: text().notNull(),
    tokenHash: text().notNull().unique(),
    ttlMinutes: integer().notNull(),
    expiresAt: date({ mode: 'date' }).notNull(),
    usedAt: date({ mode: 'date' }),
    createdAt: date({ mode: 'date' }).notNull(),
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

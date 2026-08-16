import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

const EmailVerificationCodeModel = pgTable(
  'email_verification_codes',
  {
    id: text().primaryKey(),
    farmerId: text()
      .notNull()
      .references(() => FarmerModel.id),
    codeHash: text().notNull(),
    ttlMinutes: integer().notNull(),
    attempts: integer().default(0).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    invalidatedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull(),
  },
  table => [index('evc_farmer_idx').on(table.farmerId)],
);

export const EmailVerificationCodeRelations = relations(
  EmailVerificationCodeModel,
  ({ one }) => ({
    farmer: one(FarmerModel, {
      fields: [EmailVerificationCodeModel.farmerId],
      references: [FarmerModel.id],
    }),
  }),
);

export default EmailVerificationCodeModel;

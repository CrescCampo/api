import { relations } from 'drizzle-orm';
import { text, pgTable, date, index } from 'drizzle-orm/pg-core';
import FarmerModel from './Farmer';

const RefreshTokenModel = pgTable(
  'refresh_tokens',
  {
    id: text().primaryKey().notNull().unique(),
    hash: text().notNull().unique(),
    expiresAt: date({ mode: 'date' }).notNull(),
    revokedAt: date({ mode: 'date' }),
    createdAt: date({ mode: 'date' }).notNull(),
    lastUsedAt: date({ mode: 'date' }),
    farmerId: text().notNull(),
    replacedById: text(),
    familyId: text().notNull(),
    userAgent: text(),
    ipAddress: text(),
  },
  table => [
    index('rt_family_idx').on(table.familyId),
    index('rt_farmer_idx').on(table.farmerId),
  ],
);

export const RefreshTokenRelations = relations(
  RefreshTokenModel,
  ({ one }) => ({
    farmer: one(FarmerModel, {
      fields: [RefreshTokenModel.farmerId],
      references: [FarmerModel.id],
    }),
  }),
);

export default RefreshTokenModel;

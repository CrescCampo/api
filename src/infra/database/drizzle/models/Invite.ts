import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const InviteModel = pgTable('invites', {
  id: text().primaryKey(),
  code: text().unique().notNull(),
  maxUses: integer().default(1).notNull(),
  usedCount: integer().default(0).notNull(),
  expiresAt: timestamp({ withTimezone: true }),
  revokedAt: timestamp({ withTimezone: true }),
  note: text(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
});

export default InviteModel;

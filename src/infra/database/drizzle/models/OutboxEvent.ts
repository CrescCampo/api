import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const OutboxEventModel = pgTable('outbox_events', {
  id: text().primaryKey(),
  event: text().notNull(),
  entity: text().notNull(),
  createdAt: timestamp({ mode: 'date' }).notNull(),
});

export default OutboxEventModel;

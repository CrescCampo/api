import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const waIncomingMessages = pgTable('wa_incoming_messages', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

export default waIncomingMessages;

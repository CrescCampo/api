import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const messages = pgTable('messages', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  text: text('text').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  retryCount: integer('retry_count').default(0),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  sentAt: timestamp('sent_at'),
});

export default messages;

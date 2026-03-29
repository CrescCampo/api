import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const waConversations = pgTable('wa_conversations', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  farmerId: text('farmer_id'),
  context: jsonb('context')
    .notNull()
    .default(sql`'[]'::jsonb`),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export default waConversations;

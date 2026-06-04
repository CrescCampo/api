import { pgEnum, timestamp, text, pgTable, varchar } from 'drizzle-orm/pg-core';

export const audioQueueStatus = pgEnum('status', [
  'PENDING',
  'PROCESSED',
  'FAILED',
]);

export const AudioQueueModel = pgTable('audio_queue', {
  id: text().primaryKey().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
  phoneNumber: varchar({ length: 20 }).notNull(),
  jid: varchar('jid', { length: 100 }),
  status: audioQueueStatus().notNull(),
  failReason: text(),
  error: text(),
  processedAt: timestamp(),
  s3Url: text().notNull(),
});

export default AudioQueueModel;

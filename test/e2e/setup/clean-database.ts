import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

export async function cleanDatabase(): Promise<void> {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB_NAME,
  });

  const db = drizzle(pool, { casing: 'snake_case' });

  await db.execute(
    sql`TRUNCATE TABLE farmers, farms, feedbacks, harvests, transactions, cultures, transaction_categories, outbox_events RESTART IDENTITY CASCADE`,
  );

  await pool.end();
}

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

  const tables = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '%drizzle%'`,
  );

  const tableNames = tables.rows.map(row => `"${row.tablename}"`).join(', ');

  if (tableNames) {
    await db.execute(
      sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`),
    );
  }

  await pool.end();
}

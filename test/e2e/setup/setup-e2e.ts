import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { resolve } from 'path';
import TestDatabase from '../helpers/test-database';

export default async function setupE2E(): Promise<void> {
  await TestDatabase.start();

  if (process.env._E2E_MIGRATED) {
    return;
  }

  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB_NAME,
  });

  const db = drizzle(pool, { casing: 'snake_case' });

  await migrate(db, {
    migrationsFolder: resolve(process.cwd(), 'src/infra/database/migrations'),
  });

  await pool.end();

  process.env._E2E_MIGRATED = 'true';
}

await setupE2E();

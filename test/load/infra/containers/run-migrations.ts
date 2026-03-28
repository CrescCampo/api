import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { resolve } from 'node:path';

interface MigrationOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export async function runMigrations(options: MigrationOptions): Promise<void> {
  const pool = new Pool({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
  });

  const db = drizzle(pool, { casing: 'snake_case' });

  await migrate(db, {
    migrationsFolder: resolve(process.cwd(), 'src/infra/database/migrations'),
  });

  await pool.end();
}

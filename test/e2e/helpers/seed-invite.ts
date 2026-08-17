import { randomUUID } from 'crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import InviteModel from 'infra/database/drizzle/models/Invite';

export default async function seedInvite(maxUses = 1): Promise<string> {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB_NAME,
  });

  const db = drizzle(pool, { casing: 'snake_case' });
  const code = `CRESC-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  await db.insert(InviteModel).values({
    id: randomUUID(),
    code,
    maxUses,
    usedCount: 0,
    createdAt: new Date(),
  });

  await pool.end();

  return code;
}

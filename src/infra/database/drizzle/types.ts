import type { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';

export type DrizzleConnection = PgDatabase<
  NodePgQueryResultHKT,
  Record<string, never>
>;

export type AppDrizzleAdapter =
  TransactionalAdapterDrizzleOrm<DrizzleConnection>;

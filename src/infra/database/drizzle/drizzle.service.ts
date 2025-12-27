import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import config from 'infra/config';

@Injectable()
export default class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  private readonly db: NodePgDatabase<Record<string, never>>;

  constructor() {
    this.pool = new Pool({
      user: config.drizzle.postgresUser,
      password: config.drizzle.postgresPass,
      database: config.drizzle.postgresDbName,
      host: config.drizzle.postgresHost,
      port: config.drizzle.postgresPort,
    });
    this.db = drizzle(this.pool, {
      casing: 'snake_case',
    });
  }

  get connection(): NodePgDatabase<Record<string, never>> {
    return this.db;
  }

  async onModuleInit(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  onModuleDestroy(): Promise<void> {
    return this.pool.end();
  }
}

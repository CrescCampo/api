import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import Farm from 'domain/enterprise/entities/Farm';
import { Injectable } from '@nestjs/common';
import FarmModel from '../models/Farm';

@Injectable()
export default class DrizzleFarmRepository implements FarmRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async save(farm: Farm): Promise<void> {
    await this.db
      .insert(FarmModel)
      .values({ id: farm.id })
      .onConflictDoUpdate({
        target: FarmModel.id,
        set: { id: farm.id },
      });
  }
}

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import HarvestModel from '../models/Harvest';

@Injectable()
export default class DrizzleHarvestRepository implements HarvestRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async save(harvest: Harvest): Promise<void> {
    await this.db
      .insert(HarvestModel)
      .values({
        id: harvest.id,
        name: harvest.name,
        cultureId: harvest.culture.id,
        startDate: harvest.startDate,
        endDate: harvest.endDate,
        revenue: harvest.revenue,
        expenses: harvest.expenses,
        createdAt: harvest.createdAt,
        updatedAt: harvest.updatedAt,
      })
      .onConflictDoUpdate({
        target: HarvestModel.id,
        set: {
          name: harvest.name,
          cultureId: harvest.culture.id,
          startDate: harvest.startDate,
          endDate: harvest.endDate,
          revenue: harvest.revenue,
          expenses: harvest.expenses,
          updatedAt: harvest.updatedAt,
        },
      });
  }

  async exists(id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: HarvestModel.id })
      .from(HarvestModel)
      .where(eq(HarvestModel.id, id))
      .limit(1);

    return !!row;
  }
}

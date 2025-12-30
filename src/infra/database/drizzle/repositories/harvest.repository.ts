import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import HarvestModel from '../models/Harvest';
import CultureModel from '../models/Culture';

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
        farmId: harvest.farmId,
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
          farmId: harvest.farmId,
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

  async findById(id: string): Promise<Harvest | null> {
    const [row] = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(eq(HarvestModel.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapRowToHarvest(row);
  }

  async findSinceByFarmId(farmId: string, since: Date): Promise<Harvest[]> {
    const rows = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(
        and(
          eq(HarvestModel.farmId, farmId),
          or(
            gte(HarvestModel.createdAt, since),
            gte(HarvestModel.updatedAt, since),
          ),
        ),
      );

    return rows.map(row => this.mapRowToHarvest(row));
  }

  async findActiveByFarmId(farmId: string): Promise<Harvest[]> {
    const rows = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(and(eq(HarvestModel.farmId, farmId), isNull(HarvestModel.endDate)));

    return rows.map(row => this.mapRowToHarvest(row));
  }

  async findRecentByFarmId(farmId: string, limit: number): Promise<Harvest[]> {
    const rows = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(eq(HarvestModel.farmId, farmId))
      .orderBy(desc(HarvestModel.startDate))
      .limit(limit);

    return rows.map(row => this.mapRowToHarvest(row));
  }

  async findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
  ): Promise<Harvest[]> {
    const rows = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(eq(HarvestModel.farmId, farmId))
      .orderBy(desc(HarvestModel.startDate))
      .limit(limit)
      .offset(offset);

    return rows.map(row => this.mapRowToHarvest(row));
  }

  async countByFarmId(farmId: string): Promise<number> {
    const [row] = await this.db
      .select({
        totalItems: sql<number>`count(*)`,
      })
      .from(HarvestModel)
      .where(eq(HarvestModel.farmId, farmId));

    return Number(row?.totalItems ?? 0);
  }

  async getTotalsByFarmId(farmId: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
  }> {
    const [row] = await this.db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${HarvestModel.revenue}), 0)`,
        totalExpenses: sql<number>`coalesce(sum(${HarvestModel.expenses}), 0)`,
      })
      .from(HarvestModel)
      .where(eq(HarvestModel.farmId, farmId));

    return {
      totalRevenue: Number(row?.totalRevenue ?? 0),
      totalExpenses: Number(row?.totalExpenses ?? 0),
    };
  }

  private mapRowToHarvest(row: {
    harvest: typeof HarvestModel.$inferSelect;
    culture: typeof CultureModel.$inferSelect;
  }): Harvest {
    const culture = Culture.create(
      {
        name: row.culture.name,
        farmId: row.culture.farmId,
      },
      row.culture.id,
    );

    return Harvest.create(
      {
        name: row.harvest.name,
        culture,
        farmId: row.harvest.farmId,
        startDate: row.harvest.startDate,
        endDate: row.harvest.endDate,
        revenue: row.harvest.revenue,
        expenses: row.harvest.expenses,
        createdAt: row.harvest.createdAt,
        updatedAt: row.harvest.updatedAt,
      },
      row.harvest.id,
    );
  }
}

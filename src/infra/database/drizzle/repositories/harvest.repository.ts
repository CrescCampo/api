import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { and, desc, eq, gte, isNotNull, isNull, or, sql } from 'drizzle-orm';
import HarvestModel from '../models/Harvest';
import CultureModel from '../models/Culture';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleHarvestRepository implements HarvestRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

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
      .where(
        and(eq(HarvestModel.farmId, farmId), isNull(HarvestModel.endDate)),
      );

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
    search?: string,
    active?: boolean,
  ): Promise<Harvest[]> {
    const searchCondition = this.buildSearchCondition(search);
    const activeCondition = this.buildActiveCondition(active);
    const whereCondition = this.buildFarmListWhereCondition(
      farmId,
      searchCondition,
      activeCondition,
    );
    const rows = await this.db
      .select({
        harvest: HarvestModel,
        culture: CultureModel,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(whereCondition)
      .orderBy(desc(HarvestModel.startDate))
      .limit(limit)
      .offset(offset);

    return rows.map(row => this.mapRowToHarvest(row));
  }

  async countByFarmId(
    farmId: string,
    search?: string,
    active?: boolean,
  ): Promise<number> {
    const searchCondition = this.buildSearchCondition(search);
    const activeCondition = this.buildActiveCondition(active);
    const whereCondition = this.buildFarmListWhereCondition(
      farmId,
      searchCondition,
      activeCondition,
    );
    const [row] = await this.db
      .select({
        totalItems: sql<number>`count(*)`,
      })
      .from(HarvestModel)
      .innerJoin(CultureModel, eq(HarvestModel.cultureId, CultureModel.id))
      .where(whereCondition);

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

  private buildSearchCondition(search?: string) {
    if (!search) {
      return undefined;
    }

    const pattern = `%${search}%`;

    return or(
      sql`${HarvestModel.name} ilike ${pattern}`,
      sql`${CultureModel.name} ilike ${pattern}`,
    );
  }

  private buildActiveCondition(active?: boolean) {
    if (active === undefined) {
      return undefined;
    }

    return active
      ? isNull(HarvestModel.endDate)
      : isNotNull(HarvestModel.endDate);
  }

  private buildFarmListWhereCondition(
    farmId: string,
    searchCondition?: ReturnType<
      DrizzleHarvestRepository['buildSearchCondition']
    >,
    activeCondition?: ReturnType<
      DrizzleHarvestRepository['buildActiveCondition']
    >,
  ) {
    if (searchCondition && activeCondition) {
      return and(
        eq(HarvestModel.farmId, farmId),
        searchCondition,
        activeCondition,
      );
    }

    if (searchCondition) {
      return and(eq(HarvestModel.farmId, farmId), searchCondition);
    }

    if (activeCondition) {
      return and(eq(HarvestModel.farmId, farmId), activeCondition);
    }

    return eq(HarvestModel.farmId, farmId);
  }
}

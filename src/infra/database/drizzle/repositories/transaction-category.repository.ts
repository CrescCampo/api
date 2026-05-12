import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { and, eq, gte, sql } from 'drizzle-orm';
import TransactionCategoryModel from '../models/TransactionCategory';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleTransactionCategoryRepository implements TransactionCategoryRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(category: TransactionCategory): Promise<void> {
    await this.db
      .insert(TransactionCategoryModel)
      .values({
        id: category.id,
        name: category.name,
        farmId: category.farmId,
        createdAt: category.createdAt,
      })
      .onConflictDoUpdate({
        target: TransactionCategoryModel.id,
        set: {
          name: category.name,
          farmId: category.farmId,
        },
      });
  }

  async findById(id: string): Promise<TransactionCategory | null> {
    const [row] = await this.db
      .select()
      .from(TransactionCategoryModel)
      .where(eq(TransactionCategoryModel.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return TransactionCategory.create(
      {
        name: row.name,
        farmId: row.farmId,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  async findByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<TransactionCategory[]> {
    const rows = await this.db
      .select()
      .from(TransactionCategoryModel)
      .where(
        and(
          eq(TransactionCategoryModel.farmId, farmId),
          gte(TransactionCategoryModel.createdAt, since),
        ),
      );

    return rows.map(row => this.mapRowToCategory(row));
  }

  async findByFarmId(farmId: string): Promise<TransactionCategory[]> {
    const rows = await this.db
      .select()
      .from(TransactionCategoryModel)
      .where(eq(TransactionCategoryModel.farmId, farmId));

    return rows.map(row => this.mapRowToCategory(row));
  }

  async saveMany(categories: TransactionCategory[]): Promise<void> {
    if (categories.length === 0) return;

    await this.db
      .insert(TransactionCategoryModel)
      .values(
        categories.map(c => ({
          id: c.id,
          name: c.name,
          farmId: c.farmId,
          createdAt: c.createdAt,
        })),
      )
      .onConflictDoUpdate({
        target: TransactionCategoryModel.id,
        set: {
          name: sql`excluded.name`,
          farmId: sql`excluded.farm_id`,
        },
      });
  }

  private mapRowToCategory(
    row: typeof TransactionCategoryModel.$inferSelect,
  ): TransactionCategory {
    return TransactionCategory.create(
      {
        name: row.name,
        farmId: row.farmId,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }
}

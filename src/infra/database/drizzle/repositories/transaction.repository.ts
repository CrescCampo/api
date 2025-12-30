import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import { Injectable } from '@nestjs/common';
import TransactionModel from '../models/Transaction';
import TransactionCategoryModel from '../models/TransactionCategory';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

@Injectable()
export default class DrizzleTransactionRepository
  implements TransactionRepository
{
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async save(transaction: Transaction): Promise<void> {
    await this.db
      .insert(TransactionModel)
      .values({
        id: transaction.id,
        harvestId: transaction.harvestId,
        categoryId: transaction.category.id,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        createdAt: transaction.createdAt,
      })
      .onConflictDoUpdate({
        target: TransactionModel.id,
        set: {
          harvestId: transaction.harvestId,
          categoryId: transaction.category.id,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
        },
      });
  }

  async findByFarmIdSince(
    farmId: string,
    since: Date,
  ): Promise<Transaction[]> {
    const rows = await this.db
      .select({
        transaction: TransactionModel,
        category: TransactionCategoryModel,
      })
      .from(TransactionModel)
      .innerJoin(
        TransactionCategoryModel,
        eq(TransactionModel.categoryId, TransactionCategoryModel.id),
      )
      .where(
        and(
          eq(TransactionCategoryModel.farmId, farmId),
          gte(TransactionModel.createdAt, since),
        ),
      );

    return rows.map(row => this.mapRowToTransaction(row));
  }

  async findByFarmIdRecent(
    farmId: string,
    limit: number,
  ): Promise<Transaction[]> {
    const rows = await this.db
      .select({
        transaction: TransactionModel,
        category: TransactionCategoryModel,
      })
      .from(TransactionModel)
      .innerJoin(
        TransactionCategoryModel,
        eq(TransactionModel.categoryId, TransactionCategoryModel.id),
      )
      .where(eq(TransactionCategoryModel.farmId, farmId))
      .orderBy(desc(TransactionModel.date))
      .limit(limit);

    return rows.map(row => this.mapRowToTransaction(row));
  }

  async findByFarmIdPaginated(
    farmId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]> {
    const rows = await this.db
      .select({
        transaction: TransactionModel,
        category: TransactionCategoryModel,
      })
      .from(TransactionModel)
      .innerJoin(
        TransactionCategoryModel,
        eq(TransactionModel.categoryId, TransactionCategoryModel.id),
      )
      .where(eq(TransactionCategoryModel.farmId, farmId))
      .orderBy(desc(TransactionModel.date))
      .limit(limit)
      .offset(offset);

    return rows.map(row => this.mapRowToTransaction(row));
  }

  async countByFarmId(farmId: string): Promise<number> {
    const [row] = await this.db
      .select({
        totalItems: sql<number>`count(*)`,
      })
      .from(TransactionModel)
      .innerJoin(
        TransactionCategoryModel,
        eq(TransactionModel.categoryId, TransactionCategoryModel.id),
      )
      .where(eq(TransactionCategoryModel.farmId, farmId));

    return Number(row?.totalItems ?? 0);
  }

  private mapRowToTransaction(row: {
    transaction: typeof TransactionModel.$inferSelect;
    category: typeof TransactionCategoryModel.$inferSelect;
  }): Transaction {
    const category = TransactionCategory.create(
      {
        name: row.category.name,
        farmId: row.category.farmId,
        createdAt: row.category.createdAt,
      },
      row.category.id,
    );

    return Transaction.create(
      {
        harvestId: row.transaction.harvestId,
        type: row.transaction.type as TransactionType,
        description: row.transaction.description,
        amount: row.transaction.amount,
        category,
        date: row.transaction.date,
        createdAt: row.transaction.createdAt,
      },
      row.transaction.id,
    );
  }
}

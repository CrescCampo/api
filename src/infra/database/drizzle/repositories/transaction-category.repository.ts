import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import TransactionCategoryModel from '../models/TransactionCategory';

@Injectable()
export default class DrizzleTransactionCategoryRepository
  implements TransactionCategoryRepository
{
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

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
}

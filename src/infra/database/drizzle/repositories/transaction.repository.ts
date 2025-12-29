import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import Transaction from 'domain/enterprise/entities/Transaction';
import { Injectable } from '@nestjs/common';
import TransactionModel from '../models/Transaction';

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
}

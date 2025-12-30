import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import type { PaginationParams } from 'core/pagination-params';

export interface TransactionDTO {
  id: string;
  harvestId: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: number;
}

export interface Input {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface Output {
  transactions: TransactionDTO[];
  pagination: PaginationParams;
}

@Injectable()
export default class ListTransactionsByFarm {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new Error(`Farmer ${input.userId} not found`);
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 10;
    const offset = (page - 1) * pageSize;

    const [transactions, totalItems] = await Promise.all([
      this.transactionRepository.findByFarmIdPaginated(
        farmer.farmId,
        pageSize,
        offset,
      ),
      this.transactionRepository.countByFarmId(farmer.farmId),
    ]);

    return {
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        harvestId: transaction.harvestId,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.category.id,
        date: transaction.date.getTime(),
      })),
      pagination: {
        meta: {
          currentPage: page,
          items: transactions.length,
          totalItems,
        },
      },
    };
  }
}

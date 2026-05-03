import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import HarvestNotFoundError from 'domain/application/errors/harvest/HarvestNotFoundError';
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
  harvestId: string;
  page?: number;
  pageSize?: number;
}

export interface Output {
  transactions: TransactionDTO[];
  pagination: PaginationParams;
}

@Injectable()
export default class ListTransactionsByHarvest {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    const harvest = await this.harvestRepository.findById(input.harvestId);

    if (!harvest || harvest.farmId !== farmer.farmId) {
      throw new HarvestNotFoundError();
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 10;
    const offset = (page - 1) * pageSize;

    const [transactions, totalItems] = await Promise.all([
      this.transactionRepository.findByHarvestIdPaginated(
        input.harvestId,
        pageSize,
        offset,
      ),
      this.transactionRepository.countByHarvestId(input.harvestId),
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

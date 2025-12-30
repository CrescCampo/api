import { Injectable } from '@nestjs/common';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import type { PaginationParams } from 'core/pagination-params';

export interface Input {
  since: number;
}

export interface TransactionDTO {
  id: string;
  harvestId: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  date: number;
}

export interface CultureDTO {
  id: string;
  name: string;
}

export interface TransactionCategoryDTO {
  id: string;
  name: string;
}

export interface HarvestDTO {
  id: string;
  name: string;
  cultureId: string;
  startDate: number;
  endDate?: number;
  revenue: number;
  expenses: number;
}

export interface Output {
  cultures: CultureDTO[];
  harvests: HarvestDTO[];
  transactionCategories: TransactionCategoryDTO[];
  transactions: TransactionDTO[];
  transactionsPagination: PaginationParams;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
}

@Injectable()
export default class AppPullUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly cultureRepository: CultureRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(userId: string, input: Input): Promise<Output> {
    if (!Number.isFinite(input.since)) {
      throw new Error('Invalid since parameter');
    }

    const farmer = await this.farmerRepository.findById(userId);

    if (!farmer) {
      throw new Error(`Farmer ${userId} not found`);
    }

    const { farmId } = farmer;
    const [
      cultures,
      activeHarvests,
      recentHarvests,
      transactionCategories,
      transactions,
      totalTransactions,
      harvestTotals,
    ] = await Promise.all([
      this.cultureRepository.findByFarmId(farmId),
      this.harvestRepository.findActiveByFarmId(farmId),
      this.harvestRepository.findRecentByFarmId(farmId, 10),
      this.transactionCategoryRepository.findByFarmId(farmId),
      this.transactionRepository.findByFarmIdRecent(farmId, 10),
      this.transactionRepository.countByFarmId(farmId),
      this.harvestRepository.getTotalsByFarmId(farmId),
    ]);

    const harvestsById = new Map<string, (typeof activeHarvests)[number]>();

    activeHarvests.forEach(harvest => {
      harvestsById.set(harvest.id, harvest);
    });

    recentHarvests.forEach(harvest => {
      harvestsById.set(harvest.id, harvest);
    });

    const harvests = Array.from(harvestsById.values());
    const { totalRevenue, totalExpenses } = harvestTotals;

    return {
      cultures: cultures.map(culture => ({
        id: culture.id,
        name: culture.name,
      })),
      harvests: harvests.map(harvest => ({
        id: harvest.id,
        name: harvest.name,
        cultureId: harvest.culture.id,
        startDate: harvest.startDate.getTime(),
        endDate: harvest.endDate?.getTime(),
        revenue: harvest.revenue,
        expenses: harvest.expenses,
      })),
      transactionCategories: transactionCategories.map(category => ({
        id: category.id,
        name: category.name,
      })),
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        harvestId: transaction.harvestId,
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        categoryId: transaction.category.id,
        date: transaction.date.getTime(),
      })),
      transactionsPagination: {
        meta: {
          currentPage: 1,
          items: transactions.length,
          totalItems: totalTransactions,
        },
      },
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
    };
  }
}

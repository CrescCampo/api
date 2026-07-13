import { Injectable } from '@nestjs/common';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import Culture from 'domain/enterprise/entities/Culture';
import Harvest from 'domain/enterprise/entities/Harvest';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
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
  activeHarvests: HarvestDTO[];
  recentHarvests: HarvestDTO[];
  harvestsPagination: PaginationParams;
  transactionCategories: TransactionCategoryDTO[];
  transactions: TransactionDTO[];
  transactionsPagination: PaginationParams;
  changedHarvests: HarvestDTO[];
  changedTransactions: TransactionDTO[];
  deletedTransactionIds: string[];
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  serverTime: number;
}

const toCultureDTO = (culture: Culture): CultureDTO => ({
  id: culture.id,
  name: culture.name,
});

const toHarvestDTO = (harvest: Harvest): HarvestDTO => ({
  id: harvest.id,
  name: harvest.name,
  cultureId: harvest.culture.id,
  startDate: harvest.startDate.getTime(),
  endDate: harvest.endDate?.getTime(),
  revenue: harvest.revenue,
  expenses: harvest.expenses,
});

const toTransactionCategoryDTO = (
  category: TransactionCategory,
): TransactionCategoryDTO => ({
  id: category.id,
  name: category.name,
});

const toTransactionDTO = (transaction: Transaction): TransactionDTO => ({
  id: transaction.id,
  harvestId: transaction.harvestId,
  type: transaction.type,
  description: transaction.description,
  amount: transaction.amount,
  categoryId: transaction.category.id,
  date: transaction.date.getTime(),
});

const toPagination = (items: number, totalItems: number): PaginationParams => ({
  meta: {
    currentPage: 1,
    items,
    totalItems,
  },
});

@Injectable()
export default class AppPullUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly cultureRepository: CultureRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(userId: string, since?: number): Promise<Output> {
    const serverTime = Date.now();
    const farmer = await this.farmerRepository.findById(userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    const { farmId } = farmer;

    if (since !== undefined) {
      return this.pullChangesSince(farmId, since, serverTime);
    }

    return this.pullSnapshot(farmId, serverTime);
  }

  private async pullSnapshot(
    farmId: string,
    serverTime: number,
  ): Promise<Output> {
    const pageSize = 10;
    const [
      cultures,
      activeHarvests,
      recentHarvests,
      totalHarvests,
      transactionCategories,
      transactions,
      totalTransactions,
      harvestTotals,
    ] = await Promise.all([
      this.cultureRepository.findByFarmId(farmId),
      this.harvestRepository.findActiveByFarmId(farmId),
      this.harvestRepository.findRecentByFarmId(farmId, pageSize),
      this.harvestRepository.countByFarmId(farmId),
      this.transactionCategoryRepository.findByFarmId(farmId),
      this.transactionRepository.findByFarmIdRecent(farmId, pageSize),
      this.transactionRepository.countByFarmId(farmId),
      this.harvestRepository.getTotalsByFarmId(farmId),
    ]);

    const { totalRevenue, totalExpenses } = harvestTotals;

    return {
      cultures: cultures.map(toCultureDTO),
      activeHarvests: activeHarvests.map(toHarvestDTO),
      recentHarvests: recentHarvests.map(toHarvestDTO),
      harvestsPagination: toPagination(recentHarvests.length, totalHarvests),
      transactionCategories: transactionCategories.map(
        toTransactionCategoryDTO,
      ),
      transactions: transactions.map(toTransactionDTO),
      transactionsPagination: toPagination(
        transactions.length,
        totalTransactions,
      ),
      changedHarvests: [],
      changedTransactions: [],
      deletedTransactionIds: [],
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      serverTime,
    };
  }

  private async pullChangesSince(
    farmId: string,
    since: number,
    serverTime: number,
  ): Promise<Output> {
    const sinceDate = new Date(since);
    const [
      cultures,
      activeHarvests,
      changedHarvests,
      transactionCategories,
      changedTransactions,
      deletedTransactionIds,
      harvestTotals,
    ] = await Promise.all([
      this.cultureRepository.findByFarmId(farmId),
      this.harvestRepository.findActiveByFarmId(farmId),
      this.harvestRepository.findSinceByFarmId(farmId, sinceDate),
      this.transactionCategoryRepository.findByFarmId(farmId),
      this.transactionRepository.findByFarmIdSince(farmId, sinceDate),
      this.transactionRepository.findDeletedIdsByFarmIdSince(farmId, sinceDate),
      this.harvestRepository.getTotalsByFarmId(farmId),
    ]);

    const { totalRevenue, totalExpenses } = harvestTotals;

    return {
      cultures: cultures.map(toCultureDTO),
      activeHarvests: activeHarvests.map(toHarvestDTO),
      recentHarvests: [],
      harvestsPagination: toPagination(0, 0),
      transactionCategories: transactionCategories.map(
        toTransactionCategoryDTO,
      ),
      transactions: [],
      transactionsPagination: toPagination(0, 0),
      changedHarvests: changedHarvests.map(toHarvestDTO),
      changedTransactions: changedTransactions.map(toTransactionDTO),
      deletedTransactionIds,
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      serverTime,
    };
  }
}

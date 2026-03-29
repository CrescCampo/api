import { Injectable, Logger } from '@nestjs/common';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import Transaction from 'domain/enterprise/entities/Transaction';
import TransactionType from 'domain/enterprise/enums/TransactionType';

@Injectable()
export default class WaToolExecutorService {
  private readonly logger = new Logger(WaToolExecutorService.name);

  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
  ) {}

  async execute(
    toolName: string,
    args: Record<string, unknown>,
    farmId: string,
  ): Promise<string> {
    this.logger.log(`Executing tool: ${toolName}`);

    try {
      switch (toolName) {
        case 'create_transaction':
          return await this.createTransaction(args, farmId);
        case 'list_harvests':
          return await this.listHarvests(farmId);
        case 'list_categories':
          return await this.listCategories(farmId);
        case 'get_profit_report':
          return await this.getProfitReport(farmId);
        case 'get_harvest_expenses':
          return await this.getHarvestExpenses(args, farmId);
        default:
          return JSON.stringify({ error: `Tool desconhecida: ${toolName}` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Tool ${toolName} failed: ${message}`);
      return JSON.stringify({ error: message });
    }
  }

  private async createTransaction(
    args: Record<string, unknown>,
    farmId: string,
  ): Promise<string> {
    const harvestId = args.harvestId as string;
    const categoryId = args.categoryId as string;
    const type = args.type as string;
    const amount = args.amount as number;
    const description = args.description as string;
    const dateStr = args.date as string | undefined;

    const harvest = await this.harvestRepository.findById(harvestId);
    if (!harvest) {
      return JSON.stringify({ error: 'Não encontrei essa safra. Verifique o nome e tente novamente.' });
    }
    if (harvest.farmId !== farmId) {
      return JSON.stringify({ error: 'Essa safra não faz parte da sua fazenda.' });
    }

    const category =
      await this.transactionCategoryRepository.findById(categoryId);
    if (!category) {
      return JSON.stringify({ error: 'Não encontrei essa categoria. Verifique o nome e tente novamente.' });
    }
    if (category.farmId !== farmId) {
      return JSON.stringify({
        error: 'Essa categoria não faz parte da sua fazenda.',
      });
    }

    const transactionType =
      type === 'revenue' ? TransactionType.REVENUE : TransactionType.EXPENSE;
    const date = dateStr ? new Date(dateStr) : new Date();

    const transaction = Transaction.create({
      harvestId,
      type: transactionType,
      description,
      amount,
      category,
      date,
    });

    harvest.applyTransaction(transactionType, amount);

    await this.transactionRepository.save(transaction);
    await this.harvestRepository.save(harvest);

    const typeLabel =
      transactionType === TransactionType.REVENUE ? 'receita' : 'despesa';

    return JSON.stringify({
      success: true,
      message: `Pronto! Registrei uma ${typeLabel} de R$${amount.toFixed(2)} na safra "${harvest.name}", categoria "${category.name}".`,
    });
  }

  private async listHarvests(farmId: string): Promise<string> {
    const harvests = await this.harvestRepository.findActiveByFarmId(farmId);

    const list = harvests.map(h => ({
      id: h.id,
      name: h.name,
      culture: h.culture.name,
      revenue: h.revenue,
      expenses: h.expenses,
    }));

    return JSON.stringify(list);
  }

  private async listCategories(farmId: string): Promise<string> {
    const categories =
      await this.transactionCategoryRepository.findByFarmId(farmId);

    const list = categories.map(c => ({
      id: c.id,
      name: c.name,
    }));

    return JSON.stringify(list);
  }

  private async getProfitReport(farmId: string): Promise<string> {
    const totals = await this.harvestRepository.getTotalsByFarmId(farmId);

    return JSON.stringify({
      totalRevenue: totals.totalRevenue,
      totalExpenses: totals.totalExpenses,
      profit: totals.totalRevenue - totals.totalExpenses,
    });
  }

  private async getHarvestExpenses(
    args: Record<string, unknown>,
    farmId: string,
  ): Promise<string> {
    const harvestId = args.harvestId as string;

    const harvest = await this.harvestRepository.findById(harvestId);
    if (!harvest) {
      return JSON.stringify({ error: 'Não encontrei essa safra. Verifique o nome e tente novamente.' });
    }
    if (harvest.farmId !== farmId) {
      return JSON.stringify({ error: 'Essa safra não faz parte da sua fazenda.' });
    }

    return JSON.stringify({
      harvestName: harvest.name,
      expenses: harvest.expenses,
    });
  }
}

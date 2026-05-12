import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export interface Input {
  userId: string;
  transactionId: string;
  type?: TransactionType;
  description?: string;
  amount?: number;
  categoryId?: string;
  date?: Date;
}

export interface Output {
  transactionId: string;
}

@Injectable()
export default class EditTransaction {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly harvestRepository: HarvestRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    return this.unitOfWork.run(async () => {
      const transaction = await this.transactionRepository.findById(
        input.transactionId,
      );

      if (!transaction) {
        throw new TransactionNotFoundError();
      }

      const harvest = await this.harvestRepository.findById(
        transaction.harvestId,
      );

      if (!harvest || harvest.farmId !== farmer.farmId) {
        throw new TransactionNotFoundError();
      }

      const amountChanged = input.amount !== undefined;
      const typeChanged =
        input.type !== undefined && input.type !== transaction.type;

      if (amountChanged || typeChanged) {
        harvest.reverseTransaction(transaction.type, transaction.amount);

        const newType = input.type ?? transaction.type;
        const newAmount = input.amount ?? transaction.amount;

        if (newType === TransactionType.REVENUE) {
          harvest.reverseTransaction(TransactionType.REVENUE, -newAmount);
        } else {
          harvest.reverseTransaction(TransactionType.EXPENSE, -newAmount);
        }
      }

      if (input.type !== undefined) {
        transaction.type = input.type;
      }

      if (input.description !== undefined) {
        transaction.description = input.description;
      }

      if (input.amount !== undefined) {
        transaction.amount = input.amount;
      }

      if (input.date !== undefined) {
        transaction.date = input.date;
      }

      if (input.categoryId !== undefined) {
        const category = await this.transactionCategoryRepository.findById(
          input.categoryId,
        );

        if (!category || category.farmId !== farmer.farmId) {
          throw new TransactionNotFoundError();
        }

        transaction.category = category;
      }

      await this.transactionRepository.save(transaction);
      await this.harvestRepository.save(harvest);

      return { transactionId: transaction.id };
    });
  }
}

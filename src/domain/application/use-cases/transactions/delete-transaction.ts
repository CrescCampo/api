import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';

export interface Input {
  userId: string;
  transactionId: string;
}

export interface Output {
  transactionId: string;
}

@Injectable()
export default class DeleteTransaction {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly harvestRepository: HarvestRepository,
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

      harvest.reverseTransaction(transaction.type, transaction.amount);

      await this.transactionRepository.delete(transaction.id);
      await this.harvestRepository.save(harvest);

      return { transactionId: transaction.id };
    });
  }
}

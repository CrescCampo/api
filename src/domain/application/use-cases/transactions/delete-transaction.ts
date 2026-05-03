import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
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
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    await using tx = await this.unitOfWork.begin();

    const transaction = await tx.repositories.transactions.findById(
      input.transactionId,
    );

    if (!transaction) {
      throw new TransactionNotFoundError();
    }

    const harvest = await tx.repositories.harvests.findById(
      transaction.harvestId,
    );

    if (!harvest || harvest.farmId !== farmer.farmId) {
      throw new TransactionNotFoundError();
    }

    harvest.reverseTransaction(transaction.type, transaction.amount);

    await tx.repositories.transactions.delete(transaction.id);
    await tx.repositories.harvests.save(harvest);

    await tx.commit();

    return { transactionId: transaction.id };
  }
}

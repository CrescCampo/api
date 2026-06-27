import { Injectable } from '@nestjs/common';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import CurrentPasswordRequiredError from 'domain/application/errors/auth/CurrentPasswordRequiredError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface SetFarmerPasswordInput {
  farmerId: string;
  newPassword: string;
  currentPassword?: string;
}

@Injectable()
export default class SetFarmerPassword {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: SetFarmerPasswordInput): Promise<void> {
    const farmer = await this.farmerRepository.findById(input.farmerId);

    if (!farmer || farmer.disabled) {
      throw new FarmerNotFoundError();
    }

    if (farmer.password !== null) {
      if (!input.currentPassword) {
        throw new CurrentPasswordRequiredError();
      }

      const isCurrentValid = await this.hashComparer.compare(
        input.currentPassword,
        farmer.password,
      );

      if (!isCurrentValid) {
        throw new WrongCredentialsError();
      }
    }

    farmer.password = await this.hashGenerator.hash(input.newPassword);

    await this.unitOfWork.run(async () => {
      await this.farmerRepository.save(farmer);
    });
  }
}

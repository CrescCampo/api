import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import HarvestNotFoundError from 'domain/application/errors/harvest/HarvestNotFoundError';

export interface Input {
  userId: string;
  harvestId: string;
  name: string;
}

export interface Output {
  harvestId: string;
}

@Injectable()
export default class EditHarvestName {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly harvestRepository: HarvestRepository,
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

    harvest.name = input.name;

    await this.harvestRepository.save(harvest);

    return { harvestId: harvest.id };
  }
}

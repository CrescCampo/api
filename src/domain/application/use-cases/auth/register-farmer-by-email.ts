import HashGenerator from 'domain/application/cryptography/hash-generator';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import { Injectable } from '@nestjs/common';

export interface Input {
  name: string;
  email: string;
  password: string;
}

export interface Output {
  userId: string;
}

@Injectable()
export default class RegisterUserUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly farmRepository: FarmRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(input: Input): Promise<Output> {
    const existingFarmer = await this.farmerRepository.findByEmail(input.email);

    if (existingFarmer) {
      throw new UserAlreadyExistsError();
    }

    const farm = Farm.create({});

    await this.farmRepository.save(farm);

    const newFarmer = Farmer.create({
      name: input.name,
      email: input.email,
      farmId: farm.id,
      password: await this.hashGenerator.hash(input.password),
    });

    await this.farmerRepository.save(newFarmer);

    return {
      userId: newFarmer.id,
    };
  }
}

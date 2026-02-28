import HashGenerator from 'domain/application/cryptography/hash-generator';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Culture from 'domain/enterprise/entities/Culture';
import { Injectable } from '@nestjs/common';

const DEFAULT_CULTURES = ['Morango', 'Mandioca', 'Café', 'Pimentão'];

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
    private readonly cultureRepository: CultureRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const existingFarmer = await this.farmerRepository.findByEmail(input.email);

    if (existingFarmer) {
      throw new UserAlreadyExistsError();
    }

    const farm = Farm.create({});

    await this.farmRepository.save(farm);

    await Promise.all(
      DEFAULT_CULTURES.map(name =>
        this.cultureRepository.save(Culture.create({ name, farmId: farm.id })),
      ),
    );

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

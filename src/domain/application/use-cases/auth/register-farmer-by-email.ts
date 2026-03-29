import HashGenerator from 'domain/application/cryptography/hash-generator';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Culture from 'domain/enterprise/entities/Culture';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';
import { Injectable } from '@nestjs/common';

const DEFAULT_CULTURES = ['Morango', 'Mandioca', 'Café', 'Pimentão'];

const DEFAULT_TRANSACTION_CATEGORIES = [
  'Venda de Produtos',
  'Insumos e Defensivos',
  'Sementes e Mudas',
  'Mão de Obra',
  'Equipamentos e Manutenção',
  'Combustível',
];

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
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const existingFarmer = await this.farmerRepository.findByEmail(input.email);

    if (existingFarmer) {
      throw new UserAlreadyExistsError();
    }

    const farm = Farm.create({});

    await this.farmRepository.save(farm);

    const defaultCategories = DEFAULT_TRANSACTION_CATEGORIES.map(name =>
      TransactionCategory.create({ name, farmId: farm.id }),
    );

    await Promise.all([
      ...DEFAULT_CULTURES.map(name =>
        this.cultureRepository.save(Culture.create({ name, farmId: farm.id })),
      ),
      this.transactionCategoryRepository.saveMany(defaultCategories),
    ]);

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

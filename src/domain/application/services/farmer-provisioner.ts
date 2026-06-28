import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Culture from 'domain/enterprise/entities/Culture';
import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';

const DEFAULT_CULTURES = ['Morango', 'Mandioca', 'Café', 'Pimentão'];

const DEFAULT_TRANSACTION_CATEGORIES = [
  'Venda de Produtos',
  'Insumos e Defensivos',
  'Sementes e Mudas',
  'Mão de Obra',
  'Equipamentos e Manutenção',
  'Combustível',
];

export interface ProvisionFarmerInput {
  name: string;
  email: string;
  password?: string | null;
  googleId?: string | null;
}

@Injectable()
export default class FarmerProvisioner {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly farmRepository: FarmRepository,
    private readonly cultureRepository: CultureRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
  ) {}

  async provision(input: ProvisionFarmerInput): Promise<Farmer> {
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

    const farmer = Farmer.create({
      name: input.name,
      email: input.email,
      farmId: farm.id,
      password: input.password ?? null,
      googleId: input.googleId ?? null,
    });

    await this.farmerRepository.save(farmer);

    return farmer;
  }
}

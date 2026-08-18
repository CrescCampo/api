import { Injectable } from '@nestjs/common';
import InvalidInviteError from 'domain/application/errors/invite/InvalidInviteError';
import InviteRequiredError from 'domain/application/errors/invite/InviteRequiredError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Culture from 'domain/enterprise/entities/Culture';
import Invite from 'domain/enterprise/entities/Invite';
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
  emailVerified?: boolean;
  inviteCode?: string | null;
}

@Injectable()
export default class FarmerProvisioner {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly farmRepository: FarmRepository,
    private readonly inviteRepository: InviteRepository,
    private readonly cultureRepository: CultureRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
  ) {}

  async provision(input: ProvisionFarmerInput): Promise<Farmer> {
    const invite = await this.redeemInvite(input.inviteCode);

    const farm = Farm.create({ inviteId: invite.id });

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
      emailVerified: input.emailVerified ?? false,
    });

    await this.farmerRepository.save(farmer);

    return farmer;
  }

  private async redeemInvite(rawCode?: string | null): Promise<Invite> {
    if (!rawCode || !rawCode.trim()) {
      throw new InviteRequiredError();
    }

    const invite = await this.inviteRepository.findByCodeForUpdate(
      Invite.normalizeCode(rawCode),
    );

    if (!invite || !invite.isUsable) {
      throw new InvalidInviteError();
    }

    invite.redeem();

    await this.inviteRepository.save(invite);

    return invite;
  }
}

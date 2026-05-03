import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import type { PaginationParams } from 'core/pagination-params';

export interface HarvestDTO {
  id: string;
  name: string;
  cultureId: string;
  startDate: number;
  endDate?: number;
  revenue: number;
  expenses: number;
}

export interface Input {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
}

export interface Output {
  harvests: HarvestDTO[];
  pagination: PaginationParams;
}

@Injectable()
export default class ListHarvestsByFarm {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly harvestRepository: HarvestRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 10;
    const offset = (page - 1) * pageSize;
    const search = input.search?.trim() || undefined;
    const { active } = input;

    const [harvests, totalItems] = await Promise.all([
      this.harvestRepository.findByFarmIdPaginated(
        farmer.farmId,
        pageSize,
        offset,
        search,
        active,
      ),
      this.harvestRepository.countByFarmId(farmer.farmId, search, active),
    ]);

    return {
      harvests: harvests.map(harvest => ({
        id: harvest.id,
        name: harvest.name,
        cultureId: harvest.culture.id,
        startDate: harvest.startDate.getTime(),
        endDate: harvest.endDate?.getTime(),
        revenue: harvest.revenue,
        expenses: harvest.expenses,
      })),
      pagination: {
        meta: {
          currentPage: page,
          items: harvests.length,
          totalItems,
        },
      },
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import PullCultureDTO from 'infra/dtos/app/PullCultureDTO';
import PullHarvestDTO from 'infra/dtos/app/PullHarvestDTO';
import PullPaginationDTO from 'infra/dtos/app/PullPaginationDTO';
import PullTransactionCategoryDTO from 'infra/dtos/app/PullTransactionCategoryDTO';
import PullTransactionDTO from 'infra/dtos/app/PullTransactionDTO';

export default class PullResponseDTO {
  @ApiProperty({
    type: [PullCultureDTO],
  })
  cultures: PullCultureDTO[];

  @ApiProperty({
    type: [PullHarvestDTO],
  })
  activeHarvests: PullHarvestDTO[];

  @ApiProperty({
    type: [PullTransactionCategoryDTO],
  })
  transactionCategories: PullTransactionCategoryDTO[];

  @ApiProperty({
    type: [PullHarvestDTO],
  })
  recentHarvests: PullHarvestDTO[];

  @ApiProperty({
    type: () => PullPaginationDTO,
  })
  harvestsPagination: PullPaginationDTO;

  @ApiProperty({
    type: [PullTransactionDTO],
  })
  transactions: PullTransactionDTO[];

  @ApiProperty({
    type: () => PullPaginationDTO,
  })
  transactionsPagination: PullPaginationDTO;

  @ApiProperty({
    type: Number,
    example: 50000,
  })
  totalRevenue: number;

  @ApiProperty({
    type: Number,
    example: 32000,
  })
  totalExpenses: number;

  @ApiProperty({
    type: Number,
    example: 18000,
  })
  totalProfit: number;
}

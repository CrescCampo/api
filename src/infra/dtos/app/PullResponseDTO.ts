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
    type: [PullHarvestDTO],
    description:
      'Harvests created or updated since the "since" query param; empty on full pulls',
  })
  changedHarvests: PullHarvestDTO[];

  @ApiProperty({
    type: [PullTransactionDTO],
    description:
      'Transactions created or updated since the "since" query param; empty on full pulls',
  })
  changedTransactions: PullTransactionDTO[];

  @ApiProperty({
    type: [String],
    description:
      'IDs of transactions deleted since the "since" query param; empty on full pulls',
  })
  deletedTransactionIds: string[];

  @ApiProperty({
    type: Number,
    example: 1767225600000,
    description:
      'Server clock (epoch ms); send back as "since" on the next pull',
  })
  serverTime: number;

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

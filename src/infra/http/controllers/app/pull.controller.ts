import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import type { Request } from 'express';

class PullPaginationMetaDTO {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    type: Number,
    example: 10,
  })
  items: number;

  @ApiProperty({
    type: Number,
    example: 120,
  })
  totalItems: number;
}

class PullPaginationDTO {
  @ApiProperty({
    type: () => PullPaginationMetaDTO,
  })
  meta: PullPaginationMetaDTO;
}

class PullTransactionDTO {
  @ApiProperty({
    type: String,
    example: 'transaction-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  harvestId: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  type: TransactionType;

  @ApiProperty({
    type: String,
    example: 'Seeds',
  })
  description: string;

  @ApiProperty({
    type: Number,
    example: 120.5,
  })
  amount: number;

  @ApiProperty({
    type: String,
    example: 'category-uuid',
  })
  categoryId: string;

  @ApiProperty({
    type: Number,
    example: 1715270400000,
  })
  date: number;
}

class PullCultureDTO {
  @ApiProperty({
    type: String,
    example: 'culture-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Soy',
  })
  name: string;
}

class PullTransactionCategoryDTO {
  @ApiProperty({
    type: String,
    example: 'category-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Inputs',
  })
  name: string;
}

class PullHarvestDTO {
  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: '2024 Season',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'culture-uuid',
  })
  cultureId: string;

  @ApiProperty({
    type: Number,
    example: 1704067200000,
  })
  startDate: number;

  @ApiProperty({
    type: Number,
    example: 1719878400000,
    required: false,
  })
  endDate?: number;

  @ApiProperty({
    type: Number,
    example: 25000,
  })
  revenue: number;

  @ApiProperty({
    type: Number,
    example: 15000,
  })
  expenses: number;
}

class PullResponseDTO {
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

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('app')
@ApiTags('App')
export default class PullController {
  constructor(private readonly appPullUseCase: AppPullUseCase) {}

  @UseGuards(JwtAuthGuard)
  @Get('/pull')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Pull current app state for the authenticated farmer',
  })
  @ApiOkResponse({
    description: 'App state pulled successfully',
    type: PullResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@Req() req: AuthenticatedRequest) {
    return this.appPullUseCase.execute(req.user.id);
  }
}

import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import ListTransactionsByHarvest from 'domain/application/use-cases/app/list-transactions-by-harvest';

class HarvestParamDTO {
  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  @IsString()
  harvestId: string;
}

class PaginationQueryDTO {
  @ApiProperty({
    type: Number,
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    type: Number,
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

class TransactionPaginationMetaDTO {
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

class TransactionPaginationDTO {
  @ApiProperty({
    type: () => TransactionPaginationMetaDTO,
  })
  meta: TransactionPaginationMetaDTO;
}

class TransactionDTO {
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

class TransactionsResponseDTO {
  @ApiProperty({
    type: [TransactionDTO],
  })
  transactions: TransactionDTO[];

  @ApiProperty({
    type: () => TransactionPaginationDTO,
  })
  pagination: TransactionPaginationDTO;
}

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('harvests/:harvestId/transactions')
@ApiTags('Harvests')
export default class GetHarvestTransactionsController {
  constructor(
    private readonly listTransactionsByHarvest: ListTransactionsByHarvest,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List transactions for a harvest in the authenticated farm',
  })
  @ApiParam({ name: 'harvestId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiOkResponse({
    description: 'Transactions fetched successfully',
    type: TransactionsResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query params' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Param() params: HarvestParamDTO,
    @Query() query: PaginationQueryDTO,
  ) {
    return this.listTransactionsByHarvest.execute({
      userId: req.user.id,
      harvestId: params.harvestId,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

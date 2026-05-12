import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import ListTransactionsByFarm from 'domain/application/use-cases/transactions/list-transactions-by-farm';
import GetTransactionsQueryDTO from 'infra/dtos/transactions/GetTransactionsQueryDTO';
import GetTransactionsResponseDTO from 'infra/dtos/transactions/GetTransactionsResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('transactions')
@ApiTags('Transactions')
export default class GetTransactionsController {
  constructor(
    private readonly listTransactionsByFarm: ListTransactionsByFarm,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List transactions for the authenticated farm' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiOkResponse({
    description: 'Transactions fetched successfully',
    type: GetTransactionsResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query params' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetTransactionsQueryDTO,
  ) {
    return this.listTransactionsByFarm.execute({
      userId: req.user.id,
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
    });
  }
}

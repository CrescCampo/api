import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import ListTransactionsByHarvest from 'domain/application/use-cases/transactions/list-transactions-by-harvest';
import GetHarvestTransactionsParamDTO from 'infra/dtos/harvests/GetHarvestTransactionsParamDTO';
import GetHarvestTransactionsQueryDTO from 'infra/dtos/harvests/GetHarvestTransactionsQueryDTO';
import GetHarvestTransactionsResponseDTO from 'infra/dtos/harvests/GetHarvestTransactionsResponseDTO';

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
    type: GetHarvestTransactionsResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query params' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Param() params: GetHarvestTransactionsParamDTO,
    @Query() query: GetHarvestTransactionsQueryDTO,
  ) {
    return this.listTransactionsByHarvest.execute({
      userId: req.user.id,
      harvestId: params.harvestId,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

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
import ListHarvestsByFarm from 'domain/application/use-cases/harvests/list-harvests-by-farm';
import GetHarvestsQueryDTO from 'infra/dtos/harvests/GetHarvestsQueryDTO';
import GetHarvestsResponseDTO from 'infra/dtos/harvests/GetHarvestsResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('harvests')
@ApiTags('Harvests')
export default class GetHarvestsController {
  constructor(private readonly listHarvestsByFarm: ListHarvestsByFarm) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List harvests for the authenticated farm' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiOkResponse({
    description: 'Harvests fetched successfully',
    type: GetHarvestsResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query params' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetHarvestsQueryDTO,
  ) {
    return this.listHarvestsByFarm.execute({
      userId: req.user.id,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      active: query.active === undefined ? undefined : query.active === 'true',
    });
  }
}

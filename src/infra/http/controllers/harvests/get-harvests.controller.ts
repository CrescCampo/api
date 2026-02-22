import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import ListHarvestsByFarm from 'domain/application/use-cases/harvests/list-harvests-by-farm';

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

  @ApiProperty({
    type: String,
    required: false,
    example: '2024',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    type: String,
    required: false,
    enum: ['true', 'false'],
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  active?: string;
}

class HarvestPaginationMetaDTO {
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

class HarvestPaginationDTO {
  @ApiProperty({
    type: () => HarvestPaginationMetaDTO,
  })
  meta: HarvestPaginationMetaDTO;
}

class HarvestDTO {
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

class HarvestsResponseDTO {
  @ApiProperty({
    type: [HarvestDTO],
  })
  harvests: HarvestDTO[];

  @ApiProperty({
    type: () => HarvestPaginationDTO,
  })
  pagination: HarvestPaginationDTO;
}

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
    type: HarvestsResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination query params' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDTO,
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

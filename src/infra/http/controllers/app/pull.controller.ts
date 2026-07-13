import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import PullResponseDTO from 'infra/dtos/app/PullResponseDTO';
import type { Request } from 'express';

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
  @ApiQuery({
    name: 'since',
    required: false,
    type: Number,
    description:
      'Server timestamp (epoch ms) of the last pull; when present, returns only changes since then',
  })
  @ApiOkResponse({
    description: 'App state pulled successfully',
    type: PullResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Req() req: AuthenticatedRequest,
    @Query('since') since?: string,
  ) {
    const sinceMs = since === undefined ? NaN : Number(since);

    return this.appPullUseCase.execute(
      req.user.id,
      Number.isFinite(sinceMs) && sinceMs > 0 ? sinceMs : undefined,
    );
  }
}

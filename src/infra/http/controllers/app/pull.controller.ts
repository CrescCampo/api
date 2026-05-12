import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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
  @ApiOkResponse({
    description: 'App state pulled successfully',
    type: PullResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(@Req() req: AuthenticatedRequest) {
    return this.appPullUseCase.execute(req.user.id);
  }
}

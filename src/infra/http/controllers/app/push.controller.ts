import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import AppPushUseCase from 'domain/application/use-cases/app/push';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('app')
@ApiTags('App')
export default class PushController {
  constructor(private readonly appPushUseCase: AppPushUseCase) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('/push')
  async handle(@Body() body: any, @Req() req: AuthenticatedRequest) {
    return this.appPushUseCase.execute(req.user.id, body);
  }
}

import { Body, Controller, Headers, HttpCode, Ip, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import PasswordResetChangeUseCase from 'domain/application/use-cases/farmers/request-password-reset';
import RequestPasswordResetRequestDTO from 'infra/dtos/farmers/RequestPasswordResetRequestDTO';

@Controller('farmers')
@ApiTags('Farmers')
export default class RequestPasswordResetController {
  constructor(
    private readonly requestPasswordReset: PasswordResetChangeUseCase,
  ) {}

  @Post('password/reset')
  @HttpCode(204)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiBody({ type: RequestPasswordResetRequestDTO })
  @ApiNoContentResponse({
    description:
      'Reset email dispatched when the address matches an active farmer',
  })
  async handle(
    @Body() body: RequestPasswordResetRequestDTO,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
  ): Promise<void> {
    await this.requestPasswordReset.execute({
      email: body.email,
      userAgent: userAgent ?? '',
      requestIp: ip,
    });
  }
}

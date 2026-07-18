import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import VerifyEmailUseCase from 'domain/application/use-cases/auth/verify-email';
import EmailIpThrottlerGuard from 'infra/auth/email-ip-throttler.guard';
import AuthenticateResponseDTO from 'infra/dtos/auth/AuthenticateResponseDTO';
import VerifyEmailRequestDTO from 'infra/dtos/auth/VerifyEmailRequestDTO';

@Controller('auth')
@ApiTags('Auth')
export default class VerifyEmailController {
  constructor(private readonly verifyEmailUseCase: VerifyEmailUseCase) {}

  @Post('/verify-email')
  @UseGuards(EmailIpThrottlerGuard)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Verify email with a 6-digit code' })
  @ApiBody({
    type: VerifyEmailRequestDTO,
  })
  @ApiCreatedResponse({
    description: 'Email verified and farmer logged in successfully',
    type: AuthenticateResponseDTO,
  })
  async handle(@Body() body: VerifyEmailRequestDTO) {
    const { email, code } = body;

    const result = await this.verifyEmailUseCase.execute({ email, code });

    return result;
  }
}

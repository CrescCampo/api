import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import ResendVerificationCodeUseCase from 'domain/application/use-cases/auth/resend-verification-code';
import ResendVerificationRequestDTO from 'infra/dtos/auth/ResendVerificationRequestDTO';

@Controller('auth')
@ApiTags('Auth')
export default class ResendVerificationCodeController {
  constructor(
    private readonly resendVerificationCode: ResendVerificationCodeUseCase,
  ) {}

  @Post('/verify-email/resend')
  @HttpCode(204)
  @Throttle({ global: { ttl: 60_000, limit: 3 } })
  @ApiOperation({ summary: 'Resend the email verification code' })
  @ApiBody({ type: ResendVerificationRequestDTO })
  @ApiNoContentResponse({
    description:
      'Verification code dispatched when the address matches an unverified farmer',
  })
  async handle(@Body() body: ResendVerificationRequestDTO): Promise<void> {
    await this.resendVerificationCode.execute({ email: body.email });
  }
}

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import ResetPasswordUseCase from 'domain/application/use-cases/farmers/reset-password';
import ResetPasswordRequestDTO from 'infra/dtos/farmers/ResetPasswordRequestDTO';

@Controller('farmers')
@ApiTags('Farmers')
export default class ResetPasswordController {
  constructor(private readonly resetPassword: ResetPasswordUseCase) {}

  @Post('password/reset/confirm')
  @HttpCode(204)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Reset the password using a reset token' })
  @ApiBody({ type: ResetPasswordRequestDTO })
  @ApiNoContentResponse({
    description: 'Password updated when the token is valid and unexpired',
  })
  async handle(@Body() body: ResetPasswordRequestDTO): Promise<void> {
    await this.resetPassword.execute({
      token: body.token,
      newPassword: body.newPassword,
    });
  }
}

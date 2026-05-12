import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import EmailIpThrottlerGuard from 'infra/auth/email-ip-throttler.guard';
import AuthenticateRequestDTO from 'infra/dtos/auth/AuthenticateRequestDTO';
import AuthenticateResponseDTO from 'infra/dtos/auth/AuthenticateResponseDTO';

@Controller('auth')
@ApiTags('Auth')
export default class AuthenticateController {
  constructor(private readonly loginFarmerUseCase: LoginFarmerByEmail) {}

  @Post('/login')
  @UseGuards(EmailIpThrottlerGuard)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Authenticate farmer' })
  @ApiBody({
    type: AuthenticateRequestDTO,
  })
  @ApiOkResponse({
    description: 'Farmer Logged Successfully',
    type: AuthenticateResponseDTO,
  })
  async handle(@Body() body: AuthenticateRequestDTO) {
    const { email, password } = body;

    const result = await this.loginFarmerUseCase.execute({ email, password });

    return result;
  }
}

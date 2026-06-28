import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import LoginFarmerWithGoogle from 'domain/application/use-cases/auth/login-farmer-with-google';
import AuthenticateResponseDTO from 'infra/dtos/auth/AuthenticateResponseDTO';
import GoogleAuthRequestDTO from 'infra/dtos/auth/GoogleAuthRequestDTO';

@Controller('auth')
@ApiTags('Auth')
export default class GoogleAuthController {
  constructor(private readonly loginFarmerWithGoogle: LoginFarmerWithGoogle) {}

  @Post('/google')
  @HttpCode(200)
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Authenticate farmer with a Google ID token' })
  @ApiBody({ type: GoogleAuthRequestDTO })
  @ApiOkResponse({
    description: 'Farmer authenticated successfully',
    type: AuthenticateResponseDTO,
  })
  async handle(@Body() body: GoogleAuthRequestDTO) {
    return this.loginFarmerWithGoogle.execute({ idToken: body.idToken });
  }
}

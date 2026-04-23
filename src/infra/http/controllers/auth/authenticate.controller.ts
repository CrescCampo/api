import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString } from 'class-validator';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import EmailIpThrottlerGuard from 'infra/auth/email-ip-throttler.guard';

class AuthenticateBodyDTO {
  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: 'pass',
  })
  @IsString()
  password: string;
}

class AuthenticateResponseDTO {
  @ApiProperty({
    type: String,
    example: 'user-uuid',
  })
  userId: string;

  @ApiProperty({
    type: String,
    example: 'token',
  })
  token: string;

  @ApiProperty({
    type: String,
    example: 'Maria Clara',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  email: string;

  @ApiProperty({
    type: String,
    example: '+5511999999999',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    type: String,
    example: 'farm-uuid',
  })
  farmId: string;
}

@Controller('auth')
@ApiTags('Auth')
export default class AuthenticateController {
  constructor(private readonly loginFarmerUseCase: LoginFarmerByEmail) {}

  @Post('/login')
  @UseGuards(EmailIpThrottlerGuard)
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Health check' })
  @ApiBody({
    type: AuthenticateBodyDTO,
  })
  @ApiOkResponse({
    description: 'Farmer Logged Successfully',
    type: AuthenticateResponseDTO,
  })
  async handle(@Body() body: AuthenticateBodyDTO) {
    const { email, password } = body;

    const result = await this.loginFarmerUseCase.execute({ email, password });

    return result;
  }
}

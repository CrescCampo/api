import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import RegisterFarmerRequestDTO from 'infra/dtos/auth/RegisterFarmerRequestDTO';
import RegisterFarmerResponseDTO from 'infra/dtos/auth/RegisterFarmerResponseDTO';

@Controller('auth')
@ApiTags('Auth')
export default class RegisterFarmerController {
  constructor(private readonly registerFarmerUseCase: RegisterUserUseCase) {}

  @Post('/register')
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Register a farmer' })
  @ApiBody({
    type: RegisterFarmerRequestDTO,
  })
  @ApiCreatedResponse({
    description: 'Farmer registered successfully',
    type: RegisterFarmerResponseDTO,
  })
  async handle(@Body() body: RegisterFarmerRequestDTO) {
    const { name, email, password } = body;

    const result = await this.registerFarmerUseCase.execute({
      name,
      email,
      password,
    });

    return result;
  }
}

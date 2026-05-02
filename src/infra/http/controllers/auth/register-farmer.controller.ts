import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';

class RegisterFarmerBodyDTO {
  @ApiProperty({
    type: String,
    example: 'Maria Clara',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    type: String,
    example: 'senha@Segura1',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'password must contain a letter' })
  @Matches(/\d|[^\w\s]/, { message: 'password must contain a number or symbol' })
  password: string;
}

class RegisterFarmerResponseDTO {
  @ApiProperty({
    type: String,
    example: 'user-uuid',
  })
  userId: string;
}

@Controller('auth')
@ApiTags('Auth')
export default class RegisterFarmerController {
  constructor(private readonly registerFarmerUseCase: RegisterUserUseCase) {}

  @Post('/register')
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Register a farmer' })
  @ApiBody({
    type: RegisterFarmerBodyDTO,
  })
  @ApiCreatedResponse({
    description: 'Farmer registered successfully',
    type: RegisterFarmerResponseDTO,
  })
  async handle(@Body() body: RegisterFarmerBodyDTO) {
    const { name, email, password } = body;

    const result = await this.registerFarmerUseCase.execute({
      name,
      email,
      password,
    });

    return result;
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';

class RegisterFarmerBodyDTO {
  @ApiProperty({
    type: String,
    example: 'Maria Clara',
  })
  @IsString()
  name: string;

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

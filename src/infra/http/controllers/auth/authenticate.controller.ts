import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';

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
}

@Controller('auth')
@ApiTags('Auth')
export default class AuthenticateController {
  constructor(private readonly loginFarmerUseCase: LoginFarmerByEmail) {}

  @Post('/login')
  @ApiOperation({ summary: 'Health check' })
  @ApiBody({
    type: AuthenticateBodyDTO,
  })
  @ApiOkResponse({
    description: 'Farmer Logged Successfully',
    type: AuthenticateResponseDTO,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handle(@Body() body: AuthenticateBodyDTO) {
    const { email, password } = body;

    const result = await this.loginFarmerUseCase.execute({ email, password });

    return result;
  }
}

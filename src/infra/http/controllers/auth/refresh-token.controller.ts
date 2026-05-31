import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import InvalidTokenError from 'domain/application/errors/auth/InvalidTokenError';
import RefreshTokenUseCase from 'domain/application/use-cases/auth/refresh-token';
import RefreshTokenRequestDTO from 'infra/dtos/auth/RefreshTokenRequestDTO';

@Controller('auth')
@ApiTags('Auth')
export default class RefreshTokenController {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  @Post('/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token and return new tokens' })
  async handle(@Body() body: RefreshTokenRequestDTO) {
    try {
      const result = await this.refreshTokenUseCase.execute({
        plain: body.refreshToken,
      });

      return result;
    } catch (err) {
      if (err instanceof InvalidTokenError) {
        throw new UnauthorizedException(err.message);
      }

      throw err;
    }
  }
}

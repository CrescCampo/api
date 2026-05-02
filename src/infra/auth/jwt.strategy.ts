import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
import config from 'infra/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

class TokenPayload {
  @IsString()
  id!: string;

  @IsString()
  farmId!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsInt()
  iat?: number;

  @IsInt()
  exp!: number;
}

@Injectable()
export default class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const publicKey = config.jwt.publicKeyBase64;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: TokenPayload) {
    const instance = plainToInstance(TokenPayload, payload);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return instance;
  }
}

import 'dotenv/config';
import 'reflect-metadata';

import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import Environment from 'infra/config/Environment';

export class EnvVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  PORT: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASS: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB_NAME: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  POSTGRES_PORT: number;

  @IsEnum(Environment)
  APP_ENV: Environment;

  @IsString()
  @IsNotEmpty()
  JWT_PRIVATE_KEY_BASE_64: string;

  @IsString()
  @IsNotEmpty()
  JWT_PUBLIC_KEY_BASE_64: string;

  @IsString()
  @IsNotEmpty()
  WHATSAPP_API_URL: string;

  @IsString()
  @IsNotEmpty()
  WHATSAPP_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  OPENAI_API_KEY: string;

  @IsOptional()
  @IsNumber()
  JWT_EXPIRES_IN: number = 60 * 60 * 24 * 7;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  RATE_LIMIT_TTL: number = 5;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  RATE_LIMIT_LIMIT: number = 5;
}

const envVarsInstance = plainToInstance(EnvVariables, process.env, {
  enableImplicitConversion: true,
});
const envErrors = validateSync(envVarsInstance, { whitelist: true });

if (envErrors.length > 0) {
  const messages = envErrors
    .flatMap(error => Object.values(error.constraints ?? {}))
    .join(', ');
  throw new Error(`Invalid environment variables: ${messages}`);
}

export const envVars = envVarsInstance;

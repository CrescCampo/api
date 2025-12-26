import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
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
  PORT: number;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER!: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASS!: string;

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB_NAME!: string;

  @IsString()
  POSTGRES_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT!: number;

  @IsEnum(Environment)
  APP_ENV!: Environment;
}

export default function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvVariables, {
    ...config,
    PORT: config.PORT ? Number(config.PORT) : undefined,
    POSTGRES_DB_NAME: config.POSTGRES_DB_NAME,
    POSTGRES_PORT: config.POSTGRES_PORT
      ? Number(config.POSTGRES_PORT)
      : undefined,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class EnvVariables {
  static PORT: number;

  static POSTGRES_USER: string;

  static POSTGRES_PASS: string;

  static POSTGRES_DB_NAME: string;

  static POSTGRES_HOST: string;

  static POSTGRES_PORT: number;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

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

  EnvVariables.PORT = validatedConfig.PORT;
  EnvVariables.POSTGRES_USER = validatedConfig.POSTGRES_USER;
  EnvVariables.POSTGRES_PASS = validatedConfig.POSTGRES_PASS;
  EnvVariables.POSTGRES_DB_NAME = validatedConfig.POSTGRES_DB_NAME;
  EnvVariables.POSTGRES_HOST = validatedConfig.POSTGRES_HOST;
  EnvVariables.POSTGRES_PORT = validatedConfig.POSTGRES_PORT;

  return validatedConfig;
}

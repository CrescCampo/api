import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export default class CreateInviteRequestDTO {
  @ApiPropertyOptional({
    type: Number,
    example: 50,
    minimum: 1,
    default: 1,
    description: 'Quantos cadastros o código aceita antes de esgotar',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxUses?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-12-31T00:00:00.000Z',
    description: 'Data de expiração do convite, precisa estar no futuro',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Marcos - produtor de morango',
    description: 'Anotação interna sobre a origem do convite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

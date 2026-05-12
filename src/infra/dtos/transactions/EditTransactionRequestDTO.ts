import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export default class EditTransactionRequestDTO {
  @ApiProperty({
    enum: TransactionType,
    required: false,
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    type: String,
    required: false,
    example: 'Seeds purchase',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    type: Number,
    required: false,
    example: 150.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({
    type: String,
    required: false,
    example: 'category-uuid',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    type: Number,
    required: false,
    example: 1715270400000,
    description: 'Timestamp in milliseconds',
  })
  @IsOptional()
  @IsNumber()
  date?: number;
}

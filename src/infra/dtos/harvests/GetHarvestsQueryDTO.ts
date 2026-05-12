import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export default class GetHarvestsQueryDTO {
  @ApiProperty({
    type: Number,
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    type: Number,
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiProperty({
    type: String,
    required: false,
    example: '2024',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    type: String,
    required: false,
    enum: ['true', 'false'],
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  active?: string;
}

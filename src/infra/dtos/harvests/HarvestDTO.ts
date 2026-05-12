import { ApiProperty } from '@nestjs/swagger';

export default class HarvestDTO {
  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: '2024 Season',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'culture-uuid',
  })
  cultureId: string;

  @ApiProperty({
    type: Number,
    example: 1704067200000,
  })
  startDate: number;

  @ApiProperty({
    type: Number,
    example: 1719878400000,
    required: false,
  })
  endDate?: number;

  @ApiProperty({
    type: Number,
    example: 25000,
  })
  revenue: number;

  @ApiProperty({
    type: Number,
    example: 15000,
  })
  expenses: number;
}

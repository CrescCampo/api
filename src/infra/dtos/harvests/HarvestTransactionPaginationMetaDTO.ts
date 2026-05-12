import { ApiProperty } from '@nestjs/swagger';

export default class HarvestTransactionPaginationMetaDTO {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    type: Number,
    example: 10,
  })
  items: number;

  @ApiProperty({
    type: Number,
    example: 120,
  })
  totalItems: number;
}

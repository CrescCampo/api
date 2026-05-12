import { ApiProperty } from '@nestjs/swagger';

export default class PullTransactionCategoryDTO {
  @ApiProperty({
    type: String,
    example: 'category-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Inputs',
  })
  name: string;
}

import { ApiProperty } from '@nestjs/swagger';
import TransactionType from 'domain/enterprise/enums/TransactionType';

export default class PullTransactionDTO {
  @ApiProperty({
    type: String,
    example: 'transaction-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  harvestId: string;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  type: TransactionType;

  @ApiProperty({
    type: String,
    example: 'Seeds',
  })
  description: string;

  @ApiProperty({
    type: Number,
    example: 120.5,
  })
  amount: number;

  @ApiProperty({
    type: String,
    example: 'category-uuid',
  })
  categoryId: string;

  @ApiProperty({
    type: Number,
    example: 1715270400000,
  })
  date: number;
}

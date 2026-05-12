import { ApiProperty } from '@nestjs/swagger';

export default class EditTransactionResponseDTO {
  @ApiProperty({
    type: String,
    example: 'transaction-uuid',
  })
  transactionId: string;
}

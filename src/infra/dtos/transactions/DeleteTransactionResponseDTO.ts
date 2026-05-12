import { ApiProperty } from '@nestjs/swagger';

export default class DeleteTransactionResponseDTO {
  @ApiProperty({
    type: String,
    example: 'transaction-uuid',
  })
  transactionId: string;
}

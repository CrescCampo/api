import { ApiProperty } from '@nestjs/swagger';
import TransactionDTO from 'infra/dtos/transactions/TransactionDTO';
import TransactionPaginationDTO from 'infra/dtos/transactions/TransactionPaginationDTO';

export default class GetTransactionsResponseDTO {
  @ApiProperty({
    type: [TransactionDTO],
  })
  transactions: TransactionDTO[];

  @ApiProperty({
    type: () => TransactionPaginationDTO,
  })
  pagination: TransactionPaginationDTO;
}

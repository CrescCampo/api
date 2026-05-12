import { ApiProperty } from '@nestjs/swagger';
import TransactionPaginationMetaDTO from 'infra/dtos/transactions/TransactionPaginationMetaDTO';

export default class TransactionPaginationDTO {
  @ApiProperty({
    type: () => TransactionPaginationMetaDTO,
  })
  meta: TransactionPaginationMetaDTO;
}

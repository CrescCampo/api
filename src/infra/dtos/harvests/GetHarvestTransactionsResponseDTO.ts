import { ApiProperty } from '@nestjs/swagger';
import HarvestTransactionDTO from 'infra/dtos/harvests/HarvestTransactionDTO';
import HarvestTransactionPaginationDTO from 'infra/dtos/harvests/HarvestTransactionPaginationDTO';

export default class GetHarvestTransactionsResponseDTO {
  @ApiProperty({
    type: [HarvestTransactionDTO],
  })
  transactions: HarvestTransactionDTO[];

  @ApiProperty({
    type: () => HarvestTransactionPaginationDTO,
  })
  pagination: HarvestTransactionPaginationDTO;
}

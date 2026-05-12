import { ApiProperty } from '@nestjs/swagger';
import HarvestTransactionPaginationMetaDTO from 'infra/dtos/harvests/HarvestTransactionPaginationMetaDTO';

export default class HarvestTransactionPaginationDTO {
  @ApiProperty({
    type: () => HarvestTransactionPaginationMetaDTO,
  })
  meta: HarvestTransactionPaginationMetaDTO;
}

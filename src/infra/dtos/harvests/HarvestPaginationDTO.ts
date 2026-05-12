import { ApiProperty } from '@nestjs/swagger';
import HarvestPaginationMetaDTO from 'infra/dtos/harvests/HarvestPaginationMetaDTO';

export default class HarvestPaginationDTO {
  @ApiProperty({
    type: () => HarvestPaginationMetaDTO,
  })
  meta: HarvestPaginationMetaDTO;
}

import { ApiProperty } from '@nestjs/swagger';
import HarvestDTO from 'infra/dtos/harvests/HarvestDTO';
import HarvestPaginationDTO from 'infra/dtos/harvests/HarvestPaginationDTO';

export default class GetHarvestsResponseDTO {
  @ApiProperty({
    type: [HarvestDTO],
  })
  harvests: HarvestDTO[];

  @ApiProperty({
    type: () => HarvestPaginationDTO,
  })
  pagination: HarvestPaginationDTO;
}

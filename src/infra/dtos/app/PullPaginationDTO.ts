import { ApiProperty } from '@nestjs/swagger';
import PullPaginationMetaDTO from 'infra/dtos/app/PullPaginationMetaDTO';

export default class PullPaginationDTO {
  @ApiProperty({
    type: () => PullPaginationMetaDTO,
  })
  meta: PullPaginationMetaDTO;
}

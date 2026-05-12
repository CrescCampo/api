import { ApiProperty } from '@nestjs/swagger';

export default class EditHarvestNameResponseDTO {
  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  harvestId: string;
}

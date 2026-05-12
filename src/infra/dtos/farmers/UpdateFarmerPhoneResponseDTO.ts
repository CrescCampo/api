import { ApiProperty } from '@nestjs/swagger';

export default class UpdateFarmerPhoneResponseDTO {
  @ApiProperty({
    type: String,
    example: 'farmer-uuid',
  })
  farmerId: string;
}

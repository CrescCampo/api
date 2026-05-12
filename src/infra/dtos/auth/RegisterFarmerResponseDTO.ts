import { ApiProperty } from '@nestjs/swagger';

export default class RegisterFarmerResponseDTO {
  @ApiProperty({
    type: String,
    example: 'user-uuid',
  })
  userId: string;
}

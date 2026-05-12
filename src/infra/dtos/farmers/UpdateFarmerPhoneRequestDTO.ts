import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export default class UpdateFarmerPhoneRequestDTO {
  @ApiProperty({
    type: String,
    example: '+5511999999999',
    description: 'Phone number in E.164 format',
  })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must be in E.164 format (e.g. +5511999999999)',
  })
  phone: string;
}

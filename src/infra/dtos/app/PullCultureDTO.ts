import { ApiProperty } from '@nestjs/swagger';

export default class PullCultureDTO {
  @ApiProperty({
    type: String,
    example: 'culture-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'Soy',
  })
  name: string;
}

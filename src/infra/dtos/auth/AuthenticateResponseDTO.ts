import { ApiProperty } from '@nestjs/swagger';

export default class AuthenticateResponseDTO {
  @ApiProperty({
    type: String,
    example: 'user-uuid',
  })
  userId: string;

  @ApiProperty({
    type: String,
    example: 'token',
  })
  token: string;

  @ApiProperty({
    type: String,
    example: 'Maria Clara',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  email: string;

  @ApiProperty({
    type: String,
    example: '+5511999999999',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    type: String,
    example: 'farm-uuid',
  })
  farmId: string;
}

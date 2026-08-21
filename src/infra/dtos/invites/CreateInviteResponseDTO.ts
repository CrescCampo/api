import { ApiProperty } from '@nestjs/swagger';

export default class CreateInviteResponseDTO {
  @ApiProperty({
    type: String,
    example: 'invite-uuid',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'CRESC-4F2K',
  })
  code: string;
}

import { ApiProperty } from '@nestjs/swagger';

export default class RevokeInviteResponseDTO {
  @ApiProperty({
    type: String,
    example: 'CRESC-4F2K',
  })
  code: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-15T12:00:00.000Z',
  })
  revokedAt: Date;
}

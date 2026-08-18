import { ApiProperty } from '@nestjs/swagger';

export class InviteSummaryDTO {
  @ApiProperty({ type: String, example: 'invite-uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'CRESC-4F2K' })
  code: string;

  @ApiProperty({ type: Number, example: 50 })
  maxUses: number;

  @ApiProperty({ type: Number, example: 12 })
  usedCount: number;

  @ApiProperty({ type: Number, example: 38 })
  remainingUses: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-12-31T00:00:00.000Z',
  })
  expiresAt: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  revokedAt: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Cooperativa X',
  })
  note: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ type: Boolean, example: true })
  isUsable: boolean;

  @ApiProperty({ type: Boolean, example: false })
  isExpired: boolean;

  @ApiProperty({ type: Boolean, example: false })
  isExhausted: boolean;

  @ApiProperty({ type: Boolean, example: false })
  isRevoked: boolean;
}

export class ListInvitesPaginationMetaDTO {
  @ApiProperty({ type: Number, example: 1 })
  currentPage: number;

  @ApiProperty({ type: Number, example: 20 })
  items: number;

  @ApiProperty({ type: Number, example: 137 })
  totalItems: number;
}

export class ListInvitesPaginationDTO {
  @ApiProperty({ type: ListInvitesPaginationMetaDTO })
  meta: ListInvitesPaginationMetaDTO;
}

export default class ListInvitesResponseDTO {
  @ApiProperty({ type: [InviteSummaryDTO] })
  invites: InviteSummaryDTO[];

  @ApiProperty({ type: ListInvitesPaginationDTO })
  pagination: ListInvitesPaginationDTO;
}

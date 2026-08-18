import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import RevokeInvite from 'domain/application/use-cases/invites/revoke-invite';
import AdminEndpoint from 'infra/auth/admin-endpoint.decorator';
import RevokeInviteResponseDTO from 'infra/dtos/invites/RevokeInviteResponseDTO';

@Controller('invites')
@AdminEndpoint('Invites')
export default class RevokeInviteController {
  constructor(private readonly revokeInvite: RevokeInvite) {}

  @Post(':code/revoke')
  @HttpCode(200)
  @Throttle({ global: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Revoke an invite' })
  @ApiParam({ name: 'code', example: 'CRESC-4F2K' })
  @ApiOkResponse({
    description: 'Invite revoked successfully',
    type: RevokeInviteResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Invite not found' })
  async handle(@Param('code') code: string): Promise<RevokeInviteResponseDTO> {
    return this.revokeInvite.execute({ code });
  }
}

import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import RevokeInvite from 'domain/application/use-cases/invites/revoke-invite';
import AdminApiKeyGuard, {
  ADMIN_API_KEY_SECURITY_SCHEME,
} from 'infra/auth/admin-api-key.guard';
import RevokeInviteResponseDTO from 'infra/dtos/invites/RevokeInviteResponseDTO';

@Controller('invites')
@ApiTags('Invites')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity(ADMIN_API_KEY_SECURITY_SCHEME)
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
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Invite not found' })
  async handle(@Param('code') code: string): Promise<RevokeInviteResponseDTO> {
    return this.revokeInvite.execute({ code });
  }
}

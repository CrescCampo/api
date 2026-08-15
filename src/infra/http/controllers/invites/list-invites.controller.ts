import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import ListInvites from 'domain/application/use-cases/invites/list-invites';
import AdminApiKeyGuard, {
  ADMIN_API_KEY_SECURITY_SCHEME,
} from 'infra/auth/admin-api-key.guard';
import ListInvitesResponseDTO from 'infra/dtos/invites/ListInvitesResponseDTO';

@Controller('invites')
@ApiTags('Invites')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity(ADMIN_API_KEY_SECURITY_SCHEME)
export default class ListInvitesController {
  constructor(private readonly listInvites: ListInvites) {}

  @Get()
  @Throttle({ global: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'List invites with usage and derived state' })
  @ApiOkResponse({
    description: 'Invites listed successfully',
    type: ListInvitesResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(): Promise<ListInvitesResponseDTO> {
    return this.listInvites.execute();
  }
}

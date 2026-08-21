import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import ListInvites from 'domain/application/use-cases/invites/list-invites';
import AdminEndpoint from 'infra/auth/admin-endpoint.decorator';
import ListInvitesQueryDTO from 'infra/dtos/invites/ListInvitesQueryDTO';
import ListInvitesResponseDTO from 'infra/dtos/invites/ListInvitesResponseDTO';

@Controller('invites')
@AdminEndpoint('Invites')
export default class ListInvitesController {
  constructor(private readonly listInvites: ListInvites) {}

  @Get()
  @Throttle({ global: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'List invites with usage and derived state' })
  @ApiOkResponse({
    description: 'Invites listed successfully',
    type: ListInvitesResponseDTO,
  })
  async handle(
    @Query() query: ListInvitesQueryDTO,
  ): Promise<ListInvitesResponseDTO> {
    return this.listInvites.execute({
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

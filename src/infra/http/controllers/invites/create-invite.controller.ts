import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import CreateInvite from 'domain/application/use-cases/invites/create-invite';
import AdminEndpoint from 'infra/auth/admin-endpoint.decorator';
import CreateInviteRequestDTO from 'infra/dtos/invites/CreateInviteRequestDTO';
import CreateInviteResponseDTO from 'infra/dtos/invites/CreateInviteResponseDTO';

@Controller('invites')
@AdminEndpoint('Invites')
export default class CreateInviteController {
  constructor(private readonly createInvite: CreateInvite) {}

  @Post()
  @Throttle({ global: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create an invite' })
  @ApiBody({ type: CreateInviteRequestDTO })
  @ApiCreatedResponse({
    description: 'Invite created successfully',
    type: CreateInviteResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Invalid invite settings' })
  async handle(
    @Body() body: CreateInviteRequestDTO,
  ): Promise<CreateInviteResponseDTO> {
    const { maxUses, expiresAt, note } = body;

    return this.createInvite.execute({
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note ?? null,
    });
  }
}

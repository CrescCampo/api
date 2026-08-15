import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import CreateInvite from 'domain/application/use-cases/invites/create-invite';
import AdminApiKeyGuard, {
  ADMIN_API_KEY_SECURITY_SCHEME,
} from 'infra/auth/admin-api-key.guard';
import CreateInviteRequestDTO from 'infra/dtos/invites/CreateInviteRequestDTO';
import CreateInviteResponseDTO from 'infra/dtos/invites/CreateInviteResponseDTO';

@Controller('invites')
@ApiTags('Invites')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity(ADMIN_API_KEY_SECURITY_SCHEME)
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
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
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

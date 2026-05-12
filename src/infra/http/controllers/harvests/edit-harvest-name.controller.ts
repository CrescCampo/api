import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import EditHarvestName from 'domain/application/use-cases/harvests/edit-harvest-name';
import EditHarvestNameRequestDTO from 'infra/dtos/harvests/EditHarvestNameRequestDTO';
import EditHarvestNameResponseDTO from 'infra/dtos/harvests/EditHarvestNameResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('harvests')
@ApiTags('Harvests')
export default class EditHarvestNameController {
  constructor(private readonly editHarvestName: EditHarvestName) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/name')
  @ApiOperation({ summary: 'Edit harvest name' })
  @ApiBody({ type: EditHarvestNameRequestDTO })
  @ApiOkResponse({
    description: 'Harvest name updated successfully',
    type: EditHarvestNameResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Harvest not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Param('id') id: string,
    @Body() body: EditHarvestNameRequestDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.editHarvestName.execute({
      userId: req.user.id,
      harvestId: id,
      name: body.name,
    });
  }
}

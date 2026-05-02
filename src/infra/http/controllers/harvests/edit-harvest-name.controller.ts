import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import EditHarvestName from 'domain/application/use-cases/harvests/edit-harvest-name';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

class EditHarvestNameBodyDTO {
  @ApiProperty({
    type: String,
    example: 'Safra 2025',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

class EditHarvestNameResponseDTO {
  @ApiProperty({
    type: String,
    example: 'harvest-uuid',
  })
  harvestId: string;
}

@Controller('harvests')
@ApiTags('Harvests')
export default class EditHarvestNameController {
  constructor(private readonly editHarvestName: EditHarvestName) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/name')
  @ApiOperation({ summary: 'Edit harvest name' })
  @ApiBody({ type: EditHarvestNameBodyDTO })
  @ApiOkResponse({
    description: 'Harvest name updated successfully',
    type: EditHarvestNameResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Harvest not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async handle(
    @Param('id') id: string,
    @Body() body: EditHarvestNameBodyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.editHarvestName.execute({
      userId: req.user.id,
      harvestId: id,
      name: body.name,
    });
  }
}

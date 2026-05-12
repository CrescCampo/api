import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import UpdateFarmerPhone from 'domain/application/use-cases/farmers/update-farmer-phone';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import UpdateFarmerPhoneRequestDTO from 'infra/dtos/farmers/UpdateFarmerPhoneRequestDTO';
import UpdateFarmerPhoneResponseDTO from 'infra/dtos/farmers/UpdateFarmerPhoneResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('farmers')
@ApiTags('Farmers')
export default class UpdateFarmerPhoneController {
  constructor(private readonly updateFarmerPhone: UpdateFarmerPhone) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch('phone')
  @ApiOperation({ summary: 'Update farmer phone number' })
  @ApiBody({ type: UpdateFarmerPhoneRequestDTO })
  @ApiOkResponse({
    description: 'Phone number updated successfully',
    type: UpdateFarmerPhoneResponseDTO,
  })
  async handle(
    @Body() body: UpdateFarmerPhoneRequestDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updateFarmerPhone.execute({
      farmerId: req.user.id,
      phone: body.phone,
    });
  }
}

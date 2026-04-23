import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Matches } from 'class-validator';
import UpdateFarmerPhone from 'domain/application/use-cases/farmers/update-farmer-phone';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

class UpdateFarmerPhoneBodyDTO {
  @ApiProperty({
    type: String,
    example: '+5511999999999',
    description: 'Phone number in E.164 format',
  })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must be in E.164 format (e.g. +5511999999999)',
  })
  phone: string;
}

class UpdateFarmerPhoneResponseDTO {
  @ApiProperty({
    type: String,
    example: 'farmer-uuid',
  })
  farmerId: string;
}

@Controller('farmers')
@ApiTags('Farmers')
export default class UpdateFarmerPhoneController {
  constructor(private readonly updateFarmerPhone: UpdateFarmerPhone) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch('phone')
  @ApiOperation({ summary: 'Update farmer phone number' })
  @ApiBody({ type: UpdateFarmerPhoneBodyDTO })
  @ApiOkResponse({
    description: 'Phone number updated successfully',
    type: UpdateFarmerPhoneResponseDTO,
  })
  async handle(
    @Body() body: UpdateFarmerPhoneBodyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.updateFarmerPhone.execute({
      farmerId: req.user.id,
      phone: body.phone,
    });
  }
}

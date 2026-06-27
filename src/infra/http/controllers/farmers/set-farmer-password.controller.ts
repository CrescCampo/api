import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import SetFarmerPassword from 'domain/application/use-cases/farmers/set-farmer-password';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import SetFarmerPasswordRequestDTO from 'infra/dtos/farmers/SetFarmerPasswordRequestDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('farmers')
@ApiTags('Farmers')
export default class SetFarmerPasswordController {
  constructor(private readonly setFarmerPassword: SetFarmerPassword) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('password')
  @HttpCode(204)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Set or change the authenticated farmer password' })
  @ApiBody({ type: SetFarmerPasswordRequestDTO })
  @ApiNoContentResponse({ description: 'Password updated successfully' })
  async handle(
    @Body() body: SetFarmerPasswordRequestDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.setFarmerPassword.execute({
      farmerId: req.user.id,
      newPassword: body.newPassword,
      currentPassword: body.currentPassword,
    });
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import HealthCheckResponseDTO from 'infra/dtos/health/HealthCheckResponseDTO';

@Controller('health-check')
@ApiTags('Health')
export default class HealthCheckController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Service is healthy',
    type: HealthCheckResponseDTO,
  })
  handle() {
    return { status: 'ok' };
  }
}

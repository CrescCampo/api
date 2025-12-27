import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

class HealthCheckResponseDTO {
  @ApiProperty({ example: 'ok' })
  status: string;
}

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

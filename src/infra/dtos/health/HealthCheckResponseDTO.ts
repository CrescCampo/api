import { ApiProperty } from '@nestjs/swagger';

export default class HealthCheckResponseDTO {
  @ApiProperty({ example: 'ok' })
  status: string;
}

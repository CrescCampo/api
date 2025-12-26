import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class HealthCheckResponseDTO {
  @ApiProperty({ example: 'ok' })
  @IsString()
  status: string;
}

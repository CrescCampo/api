import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class RefreshTokenRequestDTO {
  @ApiProperty({
    type: String,
    example: 'a-very-long-opaque-refresh-token',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  refreshToken!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class ResetPasswordRequestDTO {
  @ApiProperty({
    type: String,
    description: 'Plain reset token received by email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @MaxLength(255)
  token: string;

  @ApiProperty({
    type: String,
    description: 'New account password',
    example: 'my-new-secret',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class GoogleAuthRequestDTO {
  @ApiProperty({
    type: String,
    description: 'Google OAuth ID token (JWT) obtained on the client',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  idToken: string;
}

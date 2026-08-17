import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({
    type: String,
    description:
      'Invite code. Required only when this is the first login and the account still has to be created',
    example: 'CRESC-4F2K',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  inviteCode?: string;
}

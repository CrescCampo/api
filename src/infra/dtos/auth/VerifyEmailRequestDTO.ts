import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

export default class VerifyEmailRequestDTO {
  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    type: String,
    example: '482917',
    description: '6-digit verification code sent by email',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

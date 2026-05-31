import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export default class RequestPasswordResetRequestDTO {
  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

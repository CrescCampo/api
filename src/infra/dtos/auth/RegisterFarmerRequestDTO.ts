import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export default class RegisterFarmerRequestDTO {
  @ApiProperty({
    type: String,
    example: 'Maria Clara',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'user@email.com',
  })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    type: String,
    example: 'senha@Segura1',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'password must contain a letter' })
  @Matches(/\d|[^\w\s]/, {
    message: 'password must contain a number or symbol',
  })
  password: string;
}

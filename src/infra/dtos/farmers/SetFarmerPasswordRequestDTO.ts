import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export default class SetFarmerPasswordRequestDTO {
  @ApiProperty({
    type: String,
    description: 'New account password',
    example: 'senha@Segura1',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'password must contain a letter' })
  @Matches(/\d|[^\w\s]/, {
    message: 'password must contain a number or symbol',
  })
  newPassword: string;

  @ApiProperty({
    type: String,
    required: false,
    description:
      'Current password, required only if the account already has one',
    example: 'senha@Antiga1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;
}

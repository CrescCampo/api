import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export default class EditHarvestNameRequestDTO {
  @ApiProperty({
    type: String,
    example: 'Safra 2025',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

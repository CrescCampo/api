import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import FeedbackCategory from 'domain/enterprise/enums/FeedbackCategory';

export default class SendFeedbackRequestDTO {
  @ApiProperty({
    type: Number,
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({
    type: String,
    example: 'Otima entrega e produtos frescos.',
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    enum: FeedbackCategory,
    example: FeedbackCategory.DELIVERY,
  })
  @IsEnum(FeedbackCategory)
  category: FeedbackCategory;
}

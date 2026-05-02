import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import SendFeedbackUseCase from 'domain/application/use-cases/feedbacks/send-feedback';
import FeedbackCategory from 'domain/enterprise/enums/FeedbackCategory';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

class SendFeedbackBodyDTO {
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

class SendFeedbackResponseDTO {
  @ApiProperty({
    type: String,
    example: 'feedback-uuid',
  })
  feedbackId: string;
}

@Controller('feedbacks')
@ApiTags('Feedbacks')
export default class SendFeedbackController {
  constructor(private readonly sendFeedbackUseCase: SendFeedbackUseCase) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  @ApiOperation({ summary: 'Send a feedback' })
  @ApiBody({ type: SendFeedbackBodyDTO })
  @ApiCreatedResponse({
    description: 'Feedback sent successfully',
    type: SendFeedbackResponseDTO,
  })
  async handle(
    @Body() body: SendFeedbackBodyDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    const { rating, description, category } = body;

    return this.sendFeedbackUseCase.execute({
      userId: req.user.id,
      rating,
      description,
      category,
    });
  }
}

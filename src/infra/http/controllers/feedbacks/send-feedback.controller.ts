import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import SendFeedbackUseCase from 'domain/application/use-cases/feedbacks/send-feedback';
import JwtAuthGuard from 'infra/auth/jwt-auth.guard';
import SendFeedbackRequestDTO from 'infra/dtos/feedbacks/SendFeedbackRequestDTO';
import SendFeedbackResponseDTO from 'infra/dtos/feedbacks/SendFeedbackResponseDTO';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('feedbacks')
@ApiTags('Feedbacks')
export default class SendFeedbackController {
  constructor(private readonly sendFeedbackUseCase: SendFeedbackUseCase) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  @ApiOperation({ summary: 'Send a feedback' })
  @ApiBody({ type: SendFeedbackRequestDTO })
  @ApiCreatedResponse({
    description: 'Feedback sent successfully',
    type: SendFeedbackResponseDTO,
  })
  async handle(
    @Body() body: SendFeedbackRequestDTO,
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

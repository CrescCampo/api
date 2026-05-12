import { ApiProperty } from '@nestjs/swagger';

export default class SendFeedbackResponseDTO {
  @ApiProperty({
    type: String,
    example: 'feedback-uuid',
  })
  feedbackId: string;
}

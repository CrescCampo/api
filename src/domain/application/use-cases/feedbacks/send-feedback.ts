import { Injectable } from '@nestjs/common';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import Feedback from 'domain/enterprise/entities/Feedback';
import FeedbackCategory from 'domain/enterprise/enums/FeedbackCategory';

export interface Input {
  userId: string;
  rating: number;
  description: string;
  category: FeedbackCategory;
}

export interface Output {
  feedbackId: string;
}

@Injectable()
export default class SendFeedbackUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findById(input.userId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    const feedback = Feedback.create({
      farmerId: farmer.id,
      rating: input.rating,
      description: input.description,
      category: input.category,
    });

    await this.feedbackRepository.save(feedback);

    return {
      feedbackId: feedback.id,
    };
  }
}

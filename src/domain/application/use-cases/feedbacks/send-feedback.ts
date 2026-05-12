import { Injectable } from '@nestjs/common';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
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
    private readonly unitOfWork: UnitOfWork,
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

    await this.unitOfWork.run(async () => {
      await this.feedbackRepository.save(feedback);
    });

    return {
      feedbackId: feedback.id,
    };
  }
}

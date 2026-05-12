import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import Feedback from 'domain/enterprise/entities/Feedback';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import FeedbackModel from '../models/Feedback';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleFeedbackRepository implements FeedbackRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(feedback: Feedback): Promise<void> {
    await this.db
      .insert(FeedbackModel)
      .values({
        id: feedback.id,
        farmerId: feedback.farmerId,
        rating: feedback.rating,
        description: feedback.description,
        category: feedback.category,
        createdAt: feedback.createdAt,
      })
      .onConflictDoUpdate({
        target: FeedbackModel.id,
        set: {
          farmerId: feedback.farmerId,
          rating: feedback.rating,
          description: feedback.description,
          category: feedback.category,
        },
      });
  }
}

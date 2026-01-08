import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import Feedback from 'domain/enterprise/entities/Feedback';
import { Injectable } from '@nestjs/common';
import FeedbackModel from '../models/Feedback';

@Injectable()
export default class DrizzleFeedbackRepository implements FeedbackRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

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

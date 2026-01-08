import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import Feedback from 'domain/enterprise/entities/Feedback';

export default class InMemoryFeedbackRepository implements FeedbackRepository {
  items: Feedback[] = [];

  save(feedback: Feedback): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === feedback.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = feedback;
      return Promise.resolve();
    }

    this.items.push(feedback);
    return Promise.resolve();
  }
}

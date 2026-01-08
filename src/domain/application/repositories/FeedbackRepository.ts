import Feedback from 'domain/enterprise/entities/Feedback';

export default abstract class FeedbackRepository {
  abstract save(feedback: Feedback): Promise<void>;
}

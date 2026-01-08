import Entity from 'core/entity';
import { Optional } from 'core/optional';
import FeedbackCategory from '../enums/FeedbackCategory';

interface FeedbackProps {
  farmerId: string;
  rating: number;
  description: string;
  category: FeedbackCategory;
  createdAt: Date;
}

export default class Feedback extends Entity<FeedbackProps> {
  get farmerId() {
    return this.props.farmerId;
  }

  get rating() {
    return this.props.rating;
  }

  get description() {
    return this.props.description;
  }

  get category() {
    return this.props.category;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(props: Optional<FeedbackProps, 'createdAt'>, id?: string) {
    return new Feedback(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}

import Entity from 'core/entity';
import { Optional } from 'core/optional';

interface TransactionCategoryProps {
  name: string;
  createdAt: Date;
  farmId: string;
}

export default class TransactionCategory extends Entity<TransactionCategoryProps> {

  get name() {
    return this.props.name;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get farmId() {
    return this.props.farmId;
  }

  static create(props: Optional<TransactionCategoryProps, 'createdAt'>, id?: string) {
    return new TransactionCategory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}

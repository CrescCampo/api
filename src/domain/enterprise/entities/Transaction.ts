import Entity from 'core/entity';
import { Optional } from 'core/optional';
import TransactionType from '../enums/TransactionType';
import TransactionCategory from './TransactionCategory';

interface TransactionProps {
  harvestId: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: TransactionCategory;
  date: Date;
  createdAt: Date;
}

export default class Transaction extends Entity<TransactionProps> {
  get harvestId() {
    return this.props.harvestId;
  }

  get type() {
    return this.props.type;
  }

  get description() {
    return this.props.description;
  }

  get amount() {
    return this.props.amount;
  }

  get category() {
    return this.props.category;
  }

  get date() {
    return this.props.date;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(props: Optional<TransactionProps, 'createdAt'>, id?: string) {
    return new Transaction(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}

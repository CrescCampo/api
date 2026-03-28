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

  set type(type: TransactionType) {
    this.props.type = type;
  }

  get description() {
    return this.props.description;
  }

  set description(description: string) {
    this.props.description = description;
  }

  get amount() {
    return this.props.amount;
  }

  set amount(amount: number) {
    this.props.amount = amount;
  }

  get category() {
    return this.props.category;
  }

  set category(category: TransactionCategory) {
    this.props.category = category;
  }

  get date() {
    return this.props.date;
  }

  set date(date: Date) {
    this.props.date = date;
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

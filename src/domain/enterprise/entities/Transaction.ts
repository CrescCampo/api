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
  updatedAt: Date | null;
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
    this.#touch();
  }

  get description() {
    return this.props.description;
  }

  set description(description: string) {
    this.props.description = description;
    this.#touch();
  }

  get amount() {
    return this.props.amount;
  }

  set amount(amount: number) {
    this.props.amount = amount;
    this.#touch();
  }

  get category() {
    return this.props.category;
  }

  set category(category: TransactionCategory) {
    this.props.category = category;
    this.#touch();
  }

  get date() {
    return this.props.date;
  }

  set date(date: Date) {
    this.props.date = date;
    this.#touch();
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  #touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<TransactionProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ) {
    return new Transaction(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}

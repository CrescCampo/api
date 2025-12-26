import Entity from 'core/entity';
import { Optional } from 'core/optional';
import TransactionType from '../enums/TransactionType';
import TransactionCategory from '../value-objects/TransactionCategory';

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

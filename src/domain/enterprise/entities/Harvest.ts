import Entity from 'core/entity';
import { Optional } from 'core/optional';
import TransactionType from '../enums/TransactionType';
import Culture from './Culture';

interface HarvestProps {
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
  culture: Culture;
  startDate: Date;
  endDate: Date | null;
  revenue: number;
  expenses: number;
  farmId: string;
}

export default class Harvest extends Entity<HarvestProps> {
  get name() {
    return this.props.name;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get culture() {
    return this.props.culture;
  }

  get startDate() {
    return this.props.startDate;
  }

  get endDate() {
    return this.props.endDate;
  }

  get revenue() {
    return this.props.revenue;
  }

  get expenses() {
    return this.props.expenses;
  }

  get farmId() {
    return this.props.farmId;
  }

  applyTransaction(type: TransactionType, amount: number, updatedAt?: Date) {
    if (type === TransactionType.REVENUE) {
      this.props.revenue += amount;
    } else {
      this.props.expenses += amount;
    }

    this.props.updatedAt = updatedAt ?? new Date();
  }

  static create(
    props: Optional<
      HarvestProps,
      'createdAt' | 'updatedAt' | 'revenue' | 'expenses' | 'endDate'
    >,
    id?: string,
  ) {
    const harvest = new Harvest(
      {
        ...props,
        revenue: props.revenue !== undefined ? props.revenue : 0,
        expenses: props.expenses !== undefined ? props.expenses : 0,
        endDate: props.endDate ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );

    return harvest;
  }
}

import Entity from 'core/entity';
import { Optional } from 'core/optional';
import Culture from '../value-objects/Culture';

interface HarvestProps {
  name: string;
  createdAt: Date;
  updatedAt: Date | null;
  culture: Culture;
  startDate: Date;
  endDate: Date | null;
  revenue: number;
  expenses: number;
}

export default class Harvest extends Entity<HarvestProps> {
  static create(
    props: Optional<
      HarvestProps,
      'createdAt' | 'revenue' | 'expenses' | 'endDate'
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

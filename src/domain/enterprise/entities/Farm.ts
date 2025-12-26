import Entity from 'core/entity';

interface FarmProps {}

export default class Farm extends Entity<FarmProps> {
  static create(props: FarmProps, id?: string) {
    const farm = new Farm(props, id);

    return farm;
  }
}

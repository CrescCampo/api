import Entity from 'core/entity';

interface CultureProps {
  name: string;
  farmId: string;
}

export default class Culture extends Entity<CultureProps> {
  get name() {
    return this.props.name;
  }

  get farmId() {
    return this.props.farmId;
  }

  static create(props: CultureProps, id?: string) {
    const culture = new Culture(props, id);

    return culture;
  }
}

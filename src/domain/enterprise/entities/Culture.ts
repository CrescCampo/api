import Entity from 'core/entity';

interface CultureProps {
  name: string;
}

export default class Culture extends Entity<CultureProps> {
  get name() {
    return this.props.name;
  }

  static create(props: CultureProps, id?: string) {
    const culture = new Culture(props, id);

    return culture;
  }
}

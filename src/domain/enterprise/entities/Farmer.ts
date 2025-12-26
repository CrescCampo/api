import Entity from 'core/entity';
import { Optional } from 'core/optional';

interface FarmerProps {
  name: string;
  email: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  farmId: string;
}

export default class Farmer extends Entity<FarmerProps> {
  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get disabled() {
    return this.props.disabled;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get farmId() {
    return this.props.farmId;
  }

  #touch() {
    this.props.updatedAt = new Date();
  }

  disable() {
    this.props.disabled = true;
    this.#touch();
  }

  enable() {
    this.props.disabled = false;
    this.#touch();
  }

  static create(
    props: Optional<FarmerProps, 'disabled' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ) {
    const farmer = new Farmer(
      {
        ...props,
        disabled: props.disabled !== undefined ? props.disabled : false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );

    return farmer;
  }
}

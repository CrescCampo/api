import Entity from 'core/entity';
import { Optional } from 'core/optional';

interface FarmerProps {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  lastLogin: Date | null;
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

  get lastLogin() {
    return this.props.lastLogin;
  }

  get password() {
    return this.props.password;
  }

  set password(hash: string) {
    this.props.password = hash;
    this.#touch();
  }

  get phone() {
    return this.props.phone;
  }

  set phone(phone: string | null) {
    this.props.phone = phone;
    this.#touch();
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

  logged() {
    this.props.lastLogin = new Date();
    this.#touch();
  }

  static create(
    props: Optional<
      FarmerProps,
      'disabled' | 'createdAt' | 'updatedAt' | 'lastLogin' | 'phone'
    >,
    id?: string,
  ) {
    const farmer = new Farmer(
      {
        ...props,
        phone: props.phone ?? null,
        disabled: props.disabled !== undefined ? props.disabled : false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
        lastLogin: props.lastLogin ?? null,
      },
      id,
    );

    return farmer;
  }
}

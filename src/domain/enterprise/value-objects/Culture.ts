import { Optional } from 'core/optional';

interface CultureProps {
  name: string;
  createdAt: Date;
  farmId: string;
}

export default class Culture {
  #name: string;

  #createdAt: Date;

  #farmId: string;

  private constructor(props: CultureProps) {
    this.#createdAt = props.createdAt;
    this.#name = props.name;
    this.#farmId = props.farmId;
  }

  get name() {
    return this.#name;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get farmId() {
    return this.#farmId;
  }

  static create(props: Optional<CultureProps, 'createdAt'>) {
    return new Culture({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }
}

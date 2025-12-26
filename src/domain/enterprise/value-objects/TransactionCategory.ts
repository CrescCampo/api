import { Optional } from 'core/optional';

interface TransactionCategoryProps {
  name: string;
  createdAt: Date;
  farmId: string;
}

export default class TransactionCategory {
  #name: string;

  #createdAt: Date;

  #farmId: string;

  private constructor(props: TransactionCategoryProps) {
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

  static create(props: Optional<TransactionCategoryProps, 'createdAt'>) {
    return new TransactionCategory({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }
}

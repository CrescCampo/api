import crypto from 'node:crypto';

export default abstract class Entity<Props> {
  #id: string;

  protected props: Props;

  get id() {
    return this.#id;
  }

  protected constructor(props: Props, id?: string) {
    this.props = props;
    this.#id = id ?? crypto.randomUUID();
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) {
      return true;
    }

    if (entity.id === this.id) {
      return true;
    }

    return false;
  }
}

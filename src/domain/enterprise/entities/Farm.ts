import Entity from 'core/entity';
import { Optional } from 'core/optional';
import FarmAccessStatus from '../enums/FarmAccessStatus';

interface FarmProps {
  accessStatus: FarmAccessStatus;
  inviteId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export default class Farm extends Entity<FarmProps> {
  get accessStatus() {
    return this.props.accessStatus;
  }

  get inviteId() {
    return this.props.inviteId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get hasAccess() {
    return this.props.accessStatus !== FarmAccessStatus.SUSPENDED;
  }

  suspend() {
    if (this.props.accessStatus === FarmAccessStatus.SUSPENDED) return;
    this.props.accessStatus = FarmAccessStatus.SUSPENDED;
    this.#touch();
  }

  restore() {
    if (this.props.accessStatus !== FarmAccessStatus.SUSPENDED) return;
    this.props.accessStatus = FarmAccessStatus.COURTESY;
    this.#touch();
  }

  #touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      FarmProps,
      'accessStatus' | 'inviteId' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ) {
    const farm = new Farm(
      {
        ...props,
        accessStatus: props.accessStatus ?? FarmAccessStatus.COURTESY,
        inviteId: props.inviteId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );

    return farm;
  }
}

import Entity from 'core/entity';
import { Optional } from 'core/optional';

interface PasswordResetTokenProps {
  farmerId: string;
  tokenHash: string;
  ttlMinutes: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  requestIp: string | null;
  userAgent: string | null;
}

export default class PasswordResetToken extends Entity<PasswordResetTokenProps> {
  get farmerId() {
    return this.props.farmerId;
  }

  get tokenHash() {
    return this.props.tokenHash;
  }

  get ttlMinutes() {
    return this.props.ttlMinutes;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get usedAt() {
    return this.props.usedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get requestIp() {
    return this.props.requestIp;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get isUsed() {
    return this.props.usedAt !== null;
  }

  get isExpired() {
    return this.props.expiresAt <= new Date();
  }

  get isUsable() {
    return !this.isUsed && !this.isExpired;
  }

  markAsUsed() {
    if (this.isUsed) return;
    this.props.usedAt = new Date();
  }

  static create(
    props: Optional<
      PasswordResetTokenProps,
      | 'createdAt'
      | 'usedAt'
      | 'requestIp'
      | 'userAgent'
      | 'ttlMinutes'
      | 'expiresAt'
    >,
    id?: string,
  ) {
    const ttl = props.ttlMinutes ?? 30;
    const now = new Date();

    return new PasswordResetToken(
      {
        ...props,
        farmerId: props.farmerId,
        tokenHash: props.tokenHash,
        expiresAt: props.expiresAt ?? new Date(now.getTime() + ttl * 60_000),
        usedAt: props.usedAt ?? null,
        createdAt: props.createdAt ?? now,
        requestIp: props.requestIp ?? null,
        userAgent: props.userAgent ?? null,
        ttlMinutes: ttl,
      },
      id,
    );
  }
}

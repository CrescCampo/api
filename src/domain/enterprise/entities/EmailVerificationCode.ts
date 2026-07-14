import Entity from 'core/entity';
import { Optional } from 'core/optional';

const MAX_ATTEMPTS = 5;

interface EmailVerificationCodeProps {
  farmerId: string;
  codeHash: string;
  ttlMinutes: number;
  expiresAt: Date;
  usedAt: Date | null;
  invalidatedAt: Date | null;
  attempts: number;
  createdAt: Date;
}

export default class EmailVerificationCode extends Entity<EmailVerificationCodeProps> {
  get farmerId() {
    return this.props.farmerId;
  }

  get codeHash() {
    return this.props.codeHash;
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

  get invalidatedAt() {
    return this.props.invalidatedAt;
  }

  get attempts() {
    return this.props.attempts;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get isUsed() {
    return this.props.usedAt !== null;
  }

  get isExpired() {
    return this.props.expiresAt <= new Date();
  }

  get isInvalidated() {
    return this.props.invalidatedAt !== null;
  }

  get attemptsExhausted() {
    return this.props.attempts >= MAX_ATTEMPTS;
  }

  get isUsable() {
    return (
      !this.isUsed &&
      !this.isExpired &&
      !this.isInvalidated &&
      !this.attemptsExhausted
    );
  }

  registerFailedAttempt() {
    this.props.attempts += 1;
  }

  markAsUsed() {
    if (this.isUsed) return;
    this.props.usedAt = new Date();
  }

  invalidate() {
    if (this.isInvalidated) return;
    this.props.invalidatedAt = new Date();
  }

  static create(
    props: Optional<
      EmailVerificationCodeProps,
      | 'createdAt'
      | 'usedAt'
      | 'invalidatedAt'
      | 'attempts'
      | 'ttlMinutes'
      | 'expiresAt'
    >,
    id?: string,
  ) {
    const ttl = props.ttlMinutes ?? 15;
    const now = new Date();

    return new EmailVerificationCode(
      {
        ...props,
        farmerId: props.farmerId,
        codeHash: props.codeHash,
        expiresAt: props.expiresAt ?? new Date(now.getTime() + ttl * 60_000),
        usedAt: props.usedAt ?? null,
        invalidatedAt: props.invalidatedAt ?? null,
        attempts: props.attempts ?? 0,
        createdAt: props.createdAt ?? now,
        ttlMinutes: ttl,
      },
      id,
    );
  }
}

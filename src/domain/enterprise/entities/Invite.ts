import crypto from 'node:crypto';
import Entity from 'core/entity';
import { Optional } from 'core/optional';

const CODE_PREFIX = 'CRESC-';
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 4;

interface InviteProps {
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
  note: string | null;
  createdAt: Date;
}

export default class Invite extends Entity<InviteProps> {
  get code() {
    return this.props.code;
  }

  get maxUses() {
    return this.props.maxUses;
  }

  get usedCount() {
    return this.props.usedCount;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get revokedAt() {
    return this.props.revokedAt;
  }

  get note() {
    return this.props.note;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get isExpired() {
    return this.props.expiresAt !== null && this.props.expiresAt <= new Date();
  }

  get isRevoked() {
    return this.props.revokedAt !== null;
  }

  get isExhausted() {
    return this.props.usedCount >= this.props.maxUses;
  }

  get isUsable() {
    return !this.isExpired && !this.isRevoked && !this.isExhausted;
  }

  get remainingUses() {
    return Math.max(this.props.maxUses - this.props.usedCount, 0);
  }

  redeem() {
    this.props.usedCount += 1;
  }

  revoke() {
    if (this.isRevoked) return;
    this.props.revokedAt = new Date();
  }

  static normalizeCode(raw: string) {
    return raw.trim().toUpperCase();
  }

  static generateCode() {
    let suffix = '';

    for (let index = 0; index < CODE_LENGTH; index += 1) {
      suffix += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }

    return `${CODE_PREFIX}${suffix}`;
  }

  static create(
    props: Optional<
      InviteProps,
      'maxUses' | 'usedCount' | 'expiresAt' | 'revokedAt' | 'note' | 'createdAt'
    >,
    id?: string,
  ) {
    const invite = new Invite(
      {
        ...props,
        code: Invite.normalizeCode(props.code),
        maxUses: props.maxUses ?? 1,
        usedCount: props.usedCount ?? 0,
        expiresAt: props.expiresAt ?? null,
        revokedAt: props.revokedAt ?? null,
        note: props.note ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return invite;
  }
}

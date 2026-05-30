import crypto from 'node:crypto';

import Entity from 'core/entity';
import { Optional } from 'core/optional';

const REFRESH_TOKEN_TTL_IN_DAYS = 30;

interface RefreshTokenProps {
  hash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  farmerId: string;
  replacedById: string | null;
  familyId: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export default class RefreshToken extends Entity<RefreshTokenProps> {
  get hash() {
    return this.props.hash;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get revokedAt() {
    return this.props.revokedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get lastUsedAt() {
    return this.props.lastUsedAt;
  }

  get farmerId() {
    return this.props.farmerId;
  }

  get replacedById() {
    return this.props.replacedById;
  }

  get familyId() {
    return this.props.familyId;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get isRotated() {
    return this.props.replacedById !== null;
  }

  get isRevoked() {
    return this.props.revokedAt !== null;
  }

  get isExpired() {
    return this.props.expiresAt <= new Date();
  }

  get isUsable() {
    return !this.isExpired && !this.isRevoked && !this.isRotated;
  }

  detectReuse() {
    return this.isRotated || this.isRevoked;
  }

  markAsRotated(replacedById: string) {
    if (this.isRotated) {
      throw new Error('Token already rotated');
    }
    this.props.replacedById = replacedById;
    this.props.lastUsedAt = new Date();
  }

  revoke() {
    if (this.isRevoked) return;
    this.props.revokedAt = new Date();
  }

  rotate(
    newTokenHash: string,
    userAgent?: string,
    ipAddress?: string,
  ): RefreshToken {
    const nextToken = RefreshToken.create({
      familyId: this.props.familyId,
      farmerId: this.props.farmerId,
      hash: newTokenHash,
      userAgent,
      ipAddress,
    });

    this.markAsRotated(nextToken.id);

    return nextToken;
  }

  static create(
    props: Optional<
      RefreshTokenProps,
      | 'familyId'
      | 'ipAddress'
      | 'userAgent'
      | 'replacedById'
      | 'lastUsedAt'
      | 'createdAt'
      | 'revokedAt'
      | 'expiresAt'
    >,
    id?: string,
  ) {
    const refreshToken = new RefreshToken(
      {
        ...props,
        familyId: props.familyId ?? crypto.randomUUID(),
        userAgent: props.userAgent ?? null,
        ipAddress: props.ipAddress ?? null,
        lastUsedAt: props.lastUsedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        revokedAt: props.revokedAt ?? null,
        replacedById: props.replacedById ?? null,
        expiresAt:
          props.expiresAt ??
          new Date(
            new Date().getTime() +
              REFRESH_TOKEN_TTL_IN_DAYS * 24 * 60 * 60 * 1000,
          ),
      },
      id,
    );

    return refreshToken;
  }
}

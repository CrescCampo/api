import crypto from 'node:crypto';

import Entity from 'core/entity';
import { Optional } from 'core/optional';

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
  static issue(
    props: Optional<
      RefreshTokenProps,
      | 'familyId'
      | 'ipAddress'
      | 'userAgent'
      | 'replacedById'
      | 'lastUsedAt'
      | 'createdAt'
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
      },
      id,
    );

    return refreshToken;
  }
}

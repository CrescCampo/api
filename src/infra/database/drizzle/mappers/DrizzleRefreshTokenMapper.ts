import RefreshToken from 'domain/enterprise/entities/RefreshToken';
import RefreshTokenModel from '../models/RefreshToken';

type RefreshTokenRow = typeof RefreshTokenModel.$inferSelect;

export default class DrizzleRefreshTokenMapper {
  static toDomain(refreshToken: RefreshTokenRow): RefreshToken {
    return RefreshToken.create(
      {
        ...refreshToken,
      },
      refreshToken.id,
    );
  }

  static toDrizzle(refreshToken: RefreshToken): RefreshTokenRow {
    return {
      id: refreshToken.id,
      createdAt: refreshToken.createdAt,
      hash: refreshToken.hash,
      replacedById: refreshToken.replacedById,
      revokedAt: refreshToken.revokedAt,
      lastUsedAt: refreshToken.lastUsedAt,
      ipAddress: refreshToken.ipAddress,
      farmerId: refreshToken.farmerId,
      familyId: refreshToken.familyId,
      expiresAt: refreshToken.expiresAt,
      userAgent: refreshToken.userAgent,
    };
  }
}

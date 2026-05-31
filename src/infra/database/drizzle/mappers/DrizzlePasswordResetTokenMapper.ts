import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';
import PasswordResetTokenModel from '../models/PasswordResetToken';

type PasswordResetTokenRow = typeof PasswordResetTokenModel.$inferSelect;
type PasswordResetTokenInsert = typeof PasswordResetTokenModel.$inferInsert;

export default class DrizzlePasswordResetTokenMapper {
  static toDomain(row: PasswordResetTokenRow): PasswordResetToken {
    return PasswordResetToken.create(
      {
        farmerId: row.farmerId,
        tokenHash: row.tokenHash,
        ttlMinutes: row.ttlMinutes,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt ?? null,
        createdAt: row.createdAt,
        requestIp: row.requestIp ?? null,
        userAgent: row.userAgent ?? null,
      },
      row.id,
    );
  }

  static toDrizzle(
    passwordResetToken: PasswordResetToken,
  ): PasswordResetTokenInsert {
    return {
      id: passwordResetToken.id,
      farmerId: passwordResetToken.farmerId,
      tokenHash: passwordResetToken.tokenHash,
      ttlMinutes: passwordResetToken.ttlMinutes,
      expiresAt: passwordResetToken.expiresAt,
      usedAt: passwordResetToken.usedAt,
      createdAt: passwordResetToken.createdAt,
      requestIp: passwordResetToken.requestIp,
      userAgent: passwordResetToken.userAgent,
    };
  }
}

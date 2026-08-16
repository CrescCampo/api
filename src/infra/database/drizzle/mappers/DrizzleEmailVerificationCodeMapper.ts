import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import EmailVerificationCodeModel from '../models/EmailVerificationCode';

type EmailVerificationCodeRow = typeof EmailVerificationCodeModel.$inferSelect;
type EmailVerificationCodeInsert =
  typeof EmailVerificationCodeModel.$inferInsert;

export default class DrizzleEmailVerificationCodeMapper {
  static toDomain(row: EmailVerificationCodeRow): EmailVerificationCode {
    return EmailVerificationCode.create(
      {
        farmerId: row.farmerId,
        codeHash: row.codeHash,
        ttlMinutes: row.ttlMinutes,
        attempts: row.attempts,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt ?? null,
        invalidatedAt: row.invalidatedAt ?? null,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  static toDrizzle(
    emailVerificationCode: EmailVerificationCode,
  ): EmailVerificationCodeInsert {
    return {
      id: emailVerificationCode.id,
      farmerId: emailVerificationCode.farmerId,
      codeHash: emailVerificationCode.codeHash,
      ttlMinutes: emailVerificationCode.ttlMinutes,
      attempts: emailVerificationCode.attempts,
      expiresAt: emailVerificationCode.expiresAt,
      usedAt: emailVerificationCode.usedAt,
      invalidatedAt: emailVerificationCode.invalidatedAt,
      createdAt: emailVerificationCode.createdAt,
    };
  }
}

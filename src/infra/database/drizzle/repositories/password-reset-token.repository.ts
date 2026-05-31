import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';
import { eq } from 'drizzle-orm';
import DrizzlePasswordResetTokenMapper from '../mappers/DrizzlePasswordResetTokenMapper';
import PasswordResetTokenModel from '../models/PasswordResetToken';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzlePasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(passwordResetToken: PasswordResetToken): Promise<void> {
    const row = DrizzlePasswordResetTokenMapper.toDrizzle(passwordResetToken);

    await this.db
      .insert(PasswordResetTokenModel)
      .values(row)
      .onConflictDoUpdate({
        target: PasswordResetTokenModel.id,
        set: {
          ...row,
        },
      });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await this.db
      .select()
      .from(PasswordResetTokenModel)
      .where(eq(PasswordResetTokenModel.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      return null;
    }

    return DrizzlePasswordResetTokenMapper.toDomain(row);
  }
}

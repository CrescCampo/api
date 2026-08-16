import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import { and, desc, eq, isNull } from 'drizzle-orm';
import DrizzleEmailVerificationCodeMapper from '../mappers/DrizzleEmailVerificationCodeMapper';
import EmailVerificationCodeModel from '../models/EmailVerificationCode';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleEmailVerificationCodeRepository implements EmailVerificationCodeRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(emailVerificationCode: EmailVerificationCode): Promise<void> {
    const row = DrizzleEmailVerificationCodeMapper.toDrizzle(
      emailVerificationCode,
    );

    await this.db
      .insert(EmailVerificationCodeModel)
      .values(row)
      .onConflictDoUpdate({
        target: EmailVerificationCodeModel.id,
        set: {
          ...row,
        },
      });
  }

  async findActiveByFarmerId(
    farmerId: string,
  ): Promise<EmailVerificationCode | null> {
    return this.findActive(farmerId, false);
  }

  async findActiveByFarmerIdForUpdate(
    farmerId: string,
  ): Promise<EmailVerificationCode | null> {
    return this.findActive(farmerId, true);
  }

  private async findActive(
    farmerId: string,
    lock: boolean,
  ): Promise<EmailVerificationCode | null> {
    const query = this.db
      .select()
      .from(EmailVerificationCodeModel)
      .where(
        and(
          eq(EmailVerificationCodeModel.farmerId, farmerId),
          isNull(EmailVerificationCodeModel.usedAt),
          isNull(EmailVerificationCodeModel.invalidatedAt),
        ),
      )
      .orderBy(desc(EmailVerificationCodeModel.createdAt))
      .limit(1);

    const [row] = await (lock ? query.for('update') : query);

    if (!row) {
      return null;
    }

    return DrizzleEmailVerificationCodeMapper.toDomain(row);
  }
}

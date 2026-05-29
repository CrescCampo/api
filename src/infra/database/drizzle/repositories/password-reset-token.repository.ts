import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';
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

    await this.db.insert(PasswordResetTokenModel).values(row);
  }
}

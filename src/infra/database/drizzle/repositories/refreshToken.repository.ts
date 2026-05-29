import { TransactionHost } from '@nestjs-cls/transactional';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';
import { eq } from 'drizzle-orm';
import { AppDrizzleAdapter, DrizzleConnection } from '../types';
import DrizzleRefreshTokenMapper from '../mappers/DrizzleRefreshTokenMapper';
import RefreshTokenModel from '../models/RefreshToken';

export default class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(refreshToken: RefreshToken) {
    const refreshTokenToSave =
      DrizzleRefreshTokenMapper.toDrizzle(refreshToken);

    await this.db
      .insert(RefreshTokenModel)
      .values(refreshTokenToSave)
      .onConflictDoUpdate({
        target: RefreshTokenModel.id,
        set: {
          ...refreshTokenToSave,
        },
      });
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(RefreshTokenModel)
      .where(eq(RefreshTokenModel.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return DrizzleRefreshTokenMapper.toDomain(row);
  }
}

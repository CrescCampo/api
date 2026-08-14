import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import Invite from 'domain/enterprise/entities/Invite';
import { desc, eq } from 'drizzle-orm';
import DrizzleInviteMapper from '../mappers/DrizzleInviteMapper';
import InviteModel from '../models/Invite';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleInviteRepository implements InviteRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(invite: Invite): Promise<void> {
    const row = DrizzleInviteMapper.toDrizzle(invite);

    await this.db
      .insert(InviteModel)
      .values(row)
      .onConflictDoUpdate({
        target: InviteModel.id,
        set: {
          ...row,
        },
      });
  }

  async findByCode(code: string): Promise<Invite | null> {
    return this.findOneByCode(code, false);
  }

  async findByCodeForUpdate(code: string): Promise<Invite | null> {
    return this.findOneByCode(code, true);
  }

  async list(): Promise<Invite[]> {
    const rows = await this.db
      .select()
      .from(InviteModel)
      .orderBy(desc(InviteModel.createdAt));

    return rows.map(row => DrizzleInviteMapper.toDomain(row));
  }

  private async findOneByCode(
    code: string,
    lock: boolean,
  ): Promise<Invite | null> {
    const query = this.db
      .select()
      .from(InviteModel)
      .where(eq(InviteModel.code, Invite.normalizeCode(code)))
      .limit(1);

    const [row] = lock ? await query.for('update') : await query;

    if (!row) {
      return null;
    }

    return DrizzleInviteMapper.toDomain(row);
  }
}

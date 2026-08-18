import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import InviteCodeAlreadyExistsError from 'domain/application/errors/invite/InviteCodeAlreadyExistsError';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import Invite from 'domain/enterprise/entities/Invite';
import { desc, eq, sql } from 'drizzle-orm';
import DrizzleInviteMapper from '../mappers/DrizzleInviteMapper';
import InviteModel from '../models/Invite';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

const UNIQUE_VIOLATION = '23505';
const CODE_UNIQUE_CONSTRAINT = 'invites_code_unique';

const MAX_CAUSE_DEPTH = 5;

function isCodeUniqueViolation(error: unknown): boolean {
  let current = error;

  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    const { code, constraint, cause } = (current ?? {}) as {
      code?: string;
      constraint?: string;
      cause?: unknown;
    };

    if (code === UNIQUE_VIOLATION && constraint === CODE_UNIQUE_CONSTRAINT) {
      return true;
    }

    if (cause === null || cause === undefined) {
      return false;
    }

    current = cause;
  }

  return false;
}

@Injectable()
export default class DrizzleInviteRepository implements InviteRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(invite: Invite): Promise<void> {
    const row = DrizzleInviteMapper.toDrizzle(invite);

    try {
      await this.db
        .insert(InviteModel)
        .values(row)
        .onConflictDoUpdate({
          target: InviteModel.id,
          set: {
            ...row,
          },
        });
    } catch (error) {
      if (isCodeUniqueViolation(error)) {
        throw new InviteCodeAlreadyExistsError(invite.code);
      }

      throw error;
    }
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

  async listPaginated(limit: number, offset: number): Promise<Invite[]> {
    const rows = await this.db
      .select()
      .from(InviteModel)
      .orderBy(desc(InviteModel.createdAt), desc(InviteModel.code))
      .limit(limit)
      .offset(offset);

    return rows.map(row => DrizzleInviteMapper.toDomain(row));
  }

  async count(): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(InviteModel);

    return row?.total ?? 0;
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

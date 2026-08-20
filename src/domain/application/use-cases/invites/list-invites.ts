import { Injectable } from '@nestjs/common';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import type { PaginationParams } from 'core/pagination-params';

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export interface InviteSummary {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
  note: string | null;
  createdAt: Date;
  isUsable: boolean;
  isExpired: boolean;
  isExhausted: boolean;
  isRevoked: boolean;
}

export interface Input {
  page?: number;
  pageSize?: number;
}

export interface Output {
  invites: InviteSummary[];
  pagination: PaginationParams;
}

@Injectable()
export default class ListInvites {
  constructor(private readonly inviteRepository: InviteRepository) {}

  async execute(input: Input = {}): Promise<Output> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const offset = (page - 1) * pageSize;

    const [invites, totalItems] = await Promise.all([
      this.inviteRepository.listPaginated(pageSize, offset),
      this.inviteRepository.count(),
    ]);

    return {
      invites: invites.map(invite => ({
        id: invite.id,
        code: invite.code,
        maxUses: invite.maxUses,
        usedCount: invite.usedCount,
        remainingUses: invite.remainingUses,
        expiresAt: invite.expiresAt,
        revokedAt: invite.revokedAt,
        note: invite.note,
        createdAt: invite.createdAt,
        isUsable: invite.isUsable,
        isExpired: invite.isExpired,
        isExhausted: invite.isExhausted,
        isRevoked: invite.isRevoked,
      })),
      pagination: {
        meta: {
          currentPage: page,
          items: invites.length,
          totalItems,
        },
      },
    };
  }
}

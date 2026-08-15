import { Injectable } from '@nestjs/common';
import InviteRepository from 'domain/application/repositories/InviteRepository';

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

export interface Output {
  invites: InviteSummary[];
}

@Injectable()
export default class ListInvites {
  constructor(private readonly inviteRepository: InviteRepository) {}

  async execute(): Promise<Output> {
    const invites = await this.inviteRepository.list();

    return {
      invites: invites
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(invite => ({
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
    };
  }
}

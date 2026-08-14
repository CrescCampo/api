import Invite from 'domain/enterprise/entities/Invite';
import InviteModel from '../models/Invite';

type InviteRow = typeof InviteModel.$inferSelect;
type InviteInsert = typeof InviteModel.$inferInsert;

export default class DrizzleInviteMapper {
  static toDomain(row: InviteRow): Invite {
    return Invite.create(
      {
        code: row.code,
        maxUses: row.maxUses,
        usedCount: row.usedCount,
        expiresAt: row.expiresAt ?? null,
        revokedAt: row.revokedAt ?? null,
        note: row.note ?? null,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  static toDrizzle(invite: Invite): InviteInsert {
    return {
      id: invite.id,
      code: invite.code,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
      expiresAt: invite.expiresAt,
      revokedAt: invite.revokedAt,
      note: invite.note,
      createdAt: invite.createdAt,
    };
  }
}

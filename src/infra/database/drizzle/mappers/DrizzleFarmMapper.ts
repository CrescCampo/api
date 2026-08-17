import Farm from 'domain/enterprise/entities/Farm';
import FarmAccessStatus from 'domain/enterprise/enums/FarmAccessStatus';
import FarmModel from '../models/Farm';

type FarmRow = typeof FarmModel.$inferSelect;
type FarmInsert = typeof FarmModel.$inferInsert;

export default class DrizzleFarmMapper {
  static toDomain(row: FarmRow): Farm {
    return Farm.create(
      {
        accessStatus: row.accessStatus as FarmAccessStatus,
        inviteId: row.inviteId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt ?? null,
      },
      row.id,
    );
  }

  static toDrizzle(farm: Farm): FarmInsert {
    return {
      id: farm.id,
      accessStatus: farm.accessStatus,
      inviteId: farm.inviteId,
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt,
    };
  }
}

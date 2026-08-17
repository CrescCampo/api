import FarmRepository from 'domain/application/repositories/FarmRepository';
import Farm from 'domain/enterprise/entities/Farm';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import DrizzleFarmMapper from '../mappers/DrizzleFarmMapper';
import FarmModel from '../models/Farm';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleFarmRepository implements FarmRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  async save(farm: Farm): Promise<void> {
    const row = DrizzleFarmMapper.toDrizzle(farm);

    await this.db
      .insert(FarmModel)
      .values(row)
      .onConflictDoUpdate({
        target: FarmModel.id,
        set: {
          ...row,
        },
      });
  }
}

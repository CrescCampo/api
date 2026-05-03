import FarmRepository from 'domain/application/repositories/FarmRepository';
import Farm from 'domain/enterprise/entities/Farm';
import { Injectable } from '@nestjs/common';
import FarmModel from '../models/Farm';
import type { DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleFarmRepository implements FarmRepository {
  constructor(private readonly db: DrizzleConnection) {}

  async save(farm: Farm): Promise<void> {
    await this.db
      .insert(FarmModel)
      .values({ id: farm.id })
      .onConflictDoUpdate({
        target: FarmModel.id,
        set: { id: farm.id },
      });
  }
}

import OutboxEventRepository, {
  OutboxEventRecord,
} from 'domain/application/repositories/OutboxEventRepository';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import OutboxEventModel from '../models/OutboxEvent';
import type { DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleOutboxEventRepository implements OutboxEventRepository {
  constructor(private readonly db: DrizzleConnection) {}

  async exists(id: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: OutboxEventModel.id })
      .from(OutboxEventModel)
      .where(eq(OutboxEventModel.id, id))
      .limit(1);

    return !!row;
  }

  async save(event: OutboxEventRecord): Promise<void> {
    await this.db
      .insert(OutboxEventModel)
      .values({
        id: event.id,
        event: event.event,
        entity: event.entity,
        createdAt: new Date(event.createdAt),
      })
      .onConflictDoNothing({
        target: OutboxEventModel.id,
      });
  }
}

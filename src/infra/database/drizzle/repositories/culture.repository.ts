import CultureRepository from 'domain/application/repositories/CultureRepository';
import Culture from 'domain/enterprise/entities/Culture';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import CultureModel from '../models/Culture';
import type { DrizzleConnection } from '../types';

@Injectable()
export default class DrizzleCultureRepository implements CultureRepository {
  constructor(private readonly db: DrizzleConnection) {}

  async save(culture: Culture): Promise<void> {
    await this.db
      .insert(CultureModel)
      .values({
        id: culture.id,
        name: culture.name,
        farmId: culture.farmId,
      })
      .onConflictDoUpdate({
        target: CultureModel.id,
        set: {
          name: culture.name,
          farmId: culture.farmId,
        },
      });
  }

  async findById(id: string): Promise<Culture | null> {
    const [row] = await this.db
      .select()
      .from(CultureModel)
      .where(eq(CultureModel.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return Culture.create(
      {
        name: row.name,
        farmId: row.farmId,
      },
      row.id,
    );
  }

  async findAll(): Promise<Culture[]> {
    const rows = await this.db.select().from(CultureModel);

    return rows.map(row =>
      Culture.create(
        {
          name: row.name,
          farmId: row.farmId,
        },
        row.id,
      ),
    );
  }

  async findByFarmId(farmId: string): Promise<Culture[]> {
    const rows = await this.db
      .select()
      .from(CultureModel)
      .where(eq(CultureModel.farmId, farmId));

    return rows.map(row =>
      Culture.create(
        {
          name: row.name,
          farmId: row.farmId,
        },
        row.id,
      ),
    );
  }
}

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import Culture from 'domain/enterprise/entities/Culture';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import CultureModel from '../models/Culture';

@Injectable()
export default class DrizzleCultureRepository implements CultureRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async save(culture: Culture): Promise<void> {
    await this.db
      .insert(CultureModel)
      .values({
        id: culture.id,
        name: culture.name,
      })
      .onConflictDoUpdate({
        target: CultureModel.id,
        set: {
          name: culture.name,
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
      },
      row.id,
    );
  }
}

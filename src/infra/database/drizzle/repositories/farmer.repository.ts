import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import Farmer from 'domain/enterprise/entities/Farmer';
import { Injectable } from '@nestjs/common';
import FarmerModel from '../models/Farmer';

@Injectable()
export default class DrizzleFarmerRepository implements FarmerRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async save(farmer: Farmer): Promise<void> {
    await this.db
      .insert(FarmerModel)
      .values({
        id: farmer.id,
        farmId: farmer.farmId,
        name: farmer.name,
        email: farmer.email,
        password: farmer.password,
        disabled: farmer.disabled,
        createdAt: farmer.createdAt,
        updatedAt: farmer.updatedAt,
        lastLogin: farmer.lastLogin,
      })
      .onConflictDoUpdate({
        target: FarmerModel.id,
        set: {
          farmId: farmer.farmId,
          name: farmer.name,
          email: farmer.email,
          password: farmer.password,
          disabled: farmer.disabled,
          updatedAt: farmer.updatedAt,
          lastLogin: farmer.lastLogin,
        },
      });
  }

  async findByEmail(email: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.email, email))
      .limit(1);

    if (!row) {
      return null;
    }

    return Farmer.create(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        disabled: row.disabled,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? null,
        lastLogin: row.lastLogin ?? null,
        farmId: row.farmId,
      },
      row.id,
    );
  }

  async findById(id: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return Farmer.create(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        disabled: row.disabled,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? null,
        lastLogin: row.lastLogin ?? null,
        farmId: row.farmId,
      },
      row.id,
    );
  }
}

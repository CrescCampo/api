import { eq, inArray } from 'drizzle-orm';
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
        phone: farmer.phone,
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
          phone: farmer.phone,
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
        phone: row.phone ?? null,
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
        phone: row.phone ?? null,
        disabled: row.disabled,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? null,
        lastLogin: row.lastLogin ?? null,
        farmId: row.farmId,
      },
      row.id,
    );
  }

  async findByPhone(phone: string): Promise<Farmer | null> {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const candidates = this.brazilianPhoneVariants(normalized);

    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(inArray(FarmerModel.phone, candidates))
      .limit(1);

    if (!row) {
      return null;
    }

    return Farmer.create(
      {
        name: row.name,
        email: row.email,
        password: row.password,
        phone: row.phone ?? null,
        disabled: row.disabled,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? null,
        lastLogin: row.lastLogin ?? null,
        farmId: row.farmId,
      },
      row.id,
    );
  }

  private brazilianPhoneVariants(phone: string): string[] {
    const variants = [phone];

    // Brazilian numbers: +55 + 2-digit area code + 8 or 9 digit number
    const match = phone.match(/^\+55(\d{2})(\d+)$/);
    if (match) {
      const [, areaCode, number] = match;
      if (number.length === 8) {
        // Add the 9th digit
        variants.push(`+55${areaCode}9${number}`);
      } else if (number.length === 9 && number.startsWith('9')) {
        // Remove the 9th digit
        variants.push(`+55${areaCode}${number.slice(1)}`);
      }
    }

    return variants;
  }
}

import { eq, inArray } from 'drizzle-orm';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import Farmer from 'domain/enterprise/entities/Farmer';
import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import FarmerModel from '../models/Farmer';
import type { AppDrizzleAdapter, DrizzleConnection } from '../types';

type FarmerRow = typeof FarmerModel.$inferSelect;

@Injectable()
export default class DrizzleFarmerRepository implements FarmerRepository {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {}

  private get db(): DrizzleConnection {
    return this.txHost.tx;
  }

  private toDomain(row: FarmerRow): Farmer {
    return Farmer.create(
      {
        name: row.name,
        email: row.email,
        password: row.password ?? null,
        googleId: row.googleId ?? null,
        phone: row.phone ?? null,
        disabled: row.disabled,
        createdAt: row.createdAt ?? new Date(),
        updatedAt: row.updatedAt ?? null,
        lastLogin: row.lastLogin ?? null,
        farmId: row.farmId,
        tokenVersion: row.tokenVersion,
        emailVerified: row.emailVerified,
      },
      row.id,
    );
  }

  async save(farmer: Farmer): Promise<void> {
    await this.db
      .insert(FarmerModel)
      .values({
        id: farmer.id,
        farmId: farmer.farmId,
        name: farmer.name,
        email: farmer.email,
        password: farmer.password,
        googleId: farmer.googleId,
        phone: farmer.phone,
        disabled: farmer.disabled,
        createdAt: farmer.createdAt,
        updatedAt: farmer.updatedAt,
        lastLogin: farmer.lastLogin,
        tokenVersion: farmer.tokenVersion,
        emailVerified: farmer.emailVerified,
      })
      .onConflictDoUpdate({
        target: FarmerModel.id,
        set: {
          farmId: farmer.farmId,
          name: farmer.name,
          email: farmer.email,
          password: farmer.password,
          googleId: farmer.googleId,
          phone: farmer.phone,
          disabled: farmer.disabled,
          updatedAt: farmer.updatedAt,
          lastLogin: farmer.lastLogin,
          tokenVersion: farmer.tokenVersion,
          emailVerified: farmer.emailVerified,
        },
      });
  }

  async findByEmail(email: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.email, email))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findByGoogleId(googleId: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.googleId, googleId))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.id, id))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Farmer | null> {
    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(eq(FarmerModel.id, id))
      .limit(1)
      .for('update');

    return row ? this.toDomain(row) : null;
  }

  async findByPhone(phone: string): Promise<Farmer | null> {
    const normalized = phone.startsWith('+') ? phone : `+${phone}`;
    const candidates = this.brazilianPhoneVariants(normalized);

    const [row] = await this.db
      .select()
      .from(FarmerModel)
      .where(inArray(FarmerModel.phone, candidates))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  private brazilianPhoneVariants(phone: string): string[] {
    const variants = [phone];

    const match = phone.match(/^\+55(\d{2})(\d+)$/);
    if (match) {
      const [, areaCode, number] = match;
      if (number.length === 8) {
        variants.push(`+55${areaCode}9${number}`);
      } else if (number.length === 9 && number.startsWith('9')) {
        variants.push(`+55${areaCode}${number.slice(1)}`);
      }
    }

    return variants;
  }
}

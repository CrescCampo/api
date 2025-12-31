import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import config from 'infra/config';
import TransactionType from 'domain/enterprise/enums/TransactionType';
import CultureModel from 'infra/database/drizzle/models/Culture';
import FarmModel from 'infra/database/drizzle/models/Farm';
import FarmerModel from 'infra/database/drizzle/models/Farmer';
import HarvestModel from 'infra/database/drizzle/models/Harvest';
import TransactionCategoryModel from 'infra/database/drizzle/models/TransactionCategory';
import TransactionModel from 'infra/database/drizzle/models/Transaction';

const seedIds = {
  farmId: 'seed-farm-01',
  farmerId: 'seed-farmer-01',
  cultures: Array.from(
    { length: 10 },
    (_, index) => `seed-culture-${index + 1}`,
  ),
  harvests: Array.from(
    { length: 20 },
    (_, index) => `seed-harvest-${index + 1}`,
  ),
  categories: Array.from(
    { length: 10 },
    (_, index) => `seed-category-${index + 1}`,
  ),
  transactions: Array.from(
    { length: 50 },
    (_, index) => `seed-transaction-${index + 1}`,
  ),
};

export async function seedDatabase() {
  const pool = new Pool({
    user: config.drizzle.postgresUser,
    password: config.drizzle.postgresPass,
    database: config.drizzle.postgresDbName,
    host: config.drizzle.postgresHost,
    port: config.drizzle.postgresPort,
  });
  const db = drizzle(pool, { casing: 'snake_case' });

  try {
    const now = new Date();
    const startBase = new Date('2024-01-01T00:00:00.000Z');
    const hashedPassword = await hash('password123', 8);

    await db
      .insert(FarmModel)
      .values([{ id: seedIds.farmId }])
      .onConflictDoNothing({ target: FarmModel.id });

    await db
      .insert(FarmerModel)
      .values([
        {
          id: seedIds.farmerId,
          farmId: seedIds.farmId,
          name: 'Demo Farmer',
          email: 'demo@cresc.campo',
          password: hashedPassword,
          disabled: false,
          createdAt: now,
          updatedAt: null,
          lastLogin: null,
        },
      ])
      .onConflictDoNothing({ target: FarmerModel.email });

    const cultureValues = seedIds.cultures.map((id, index) => ({
      id,
      name: `Culture ${index + 1}`,
      farmId: seedIds.farmId,
    }));

    await db
      .insert(CultureModel)
      .values(cultureValues)
      .onConflictDoNothing({ target: CultureModel.id });

    const harvestValues = seedIds.harvests.map((id, index) => {
      const startDate = new Date(startBase.getTime() + index * 86400000 * 7);
      const endDate = new Date(startDate.getTime() + 86400000 * 90);
      const cultureId = seedIds.cultures[index % seedIds.cultures.length];

      return {
        id,
        name: `Harvest ${index + 1}`,
        cultureId,
        startDate,
        endDate,
        revenue: 0,
        expenses: 0,
        createdAt: now,
        updatedAt: null,
        farmId: seedIds.farmId,
      };
    });

    await db
      .insert(HarvestModel)
      .values(harvestValues)
      .onConflictDoNothing({ target: HarvestModel.id });

    const categoryValues = seedIds.categories.map((id, index) => ({
      id,
      name: `Category ${index + 1}`,
      farmId: seedIds.farmId,
      createdAt: now,
    }));

    await db
      .insert(TransactionCategoryModel)
      .values(categoryValues)
      .onConflictDoNothing({ target: TransactionCategoryModel.id });

    const transactionValues = seedIds.transactions.map((id, index) => {
      const harvestId = seedIds.harvests[index % seedIds.harvests.length];
      const categoryId = seedIds.categories[index % seedIds.categories.length];
      const type =
        index % 2 === 0 ? TransactionType.EXPENSE : TransactionType.REVENUE;
      const amount =
        type === TransactionType.EXPENSE ? 500 + index * 5 : 900 + index * 8;
      const date = new Date(startBase.getTime() + index * 86400000 * 3);

      return {
        id,
        harvestId,
        categoryId,
        type,
        description: `Transaction ${index + 1}`,
        amount,
        date,
        createdAt: now,
      };
    });

    await db
      .insert(TransactionModel)
      .values(transactionValues)
      .onConflictDoNothing({ target: TransactionModel.id });
  } finally {
    await pool.end();
  }
}

export { seedIds };

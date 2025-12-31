import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import config from 'infra/config';
import { eq, inArray } from 'drizzle-orm';
import TransactionModel from 'infra/database/drizzle/models/Transaction';
import TransactionCategoryModel from 'infra/database/drizzle/models/TransactionCategory';
import HarvestModel from 'infra/database/drizzle/models/Harvest';
import CultureModel from 'infra/database/drizzle/models/Culture';
import FarmerModel from 'infra/database/drizzle/models/Farmer';
import FarmModel from 'infra/database/drizzle/models/Farm';
import { seedIds } from './index';

async function seedDown() {
  const pool = new Pool({
    user: config.drizzle.postgresUser,
    password: config.drizzle.postgresPass,
    database: config.drizzle.postgresDbName,
    host: config.drizzle.postgresHost,
    port: config.drizzle.postgresPort,
  });
  const db = drizzle(pool, { casing: 'snake_case' });

  try {
    await db
      .delete(TransactionModel)
      .where(inArray(TransactionModel.harvestId, seedIds.harvests));

    await db
      .delete(TransactionCategoryModel)
      .where(eq(TransactionCategoryModel.farmId, seedIds.farmId));

    await db
      .delete(HarvestModel)
      .where(eq(HarvestModel.farmId, seedIds.farmId));

    await db
      .delete(CultureModel)
      .where(eq(CultureModel.farmId, seedIds.farmId));

    await db.delete(FarmerModel).where(eq(FarmerModel.farmId, seedIds.farmId));

    await db.delete(FarmModel).where(eq(FarmModel.id, seedIds.farmId));
  } finally {
    await pool.end();
  }
}

seedDown()
  .then(() => {
    process.stdout.write('Seed down completed\n');
  })
  .catch(error => {
    process.stderr.write(
      `Seed down failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });

import { Module } from '@nestjs/common';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import OutboxEventRepository from 'domain/application/repositories/OutboxEventRepository';
import DrizzleService from './drizzle/drizzle.service';
import DrizzleFarmRepository from './drizzle/repositories/farm.repository';
import DrizzleFarmerRepository from './drizzle/repositories/farmer.repository';
import DrizzleCultureRepository from './drizzle/repositories/culture.repository';
import DrizzleHarvestRepository from './drizzle/repositories/harvest.repository';
import DrizzleTransactionCategoryRepository from './drizzle/repositories/transaction-category.repository';
import DrizzleTransactionRepository from './drizzle/repositories/transaction.repository';
import DrizzleOutboxEventRepository from './drizzle/repositories/outbox-event.repository';

@Module({
  providers: [
    DrizzleService,
    {
      provide: FarmRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleFarmRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: FarmerRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleFarmerRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: CultureRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleCultureRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: HarvestRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleHarvestRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: TransactionCategoryRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleTransactionCategoryRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: TransactionRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleTransactionRepository(drizzle.connection),
      inject: [DrizzleService],
    },
    {
      provide: OutboxEventRepository,
      useFactory: (drizzle: DrizzleService) =>
        new DrizzleOutboxEventRepository(drizzle.connection),
      inject: [DrizzleService],
    },
  ],
  exports: [
    DrizzleService,
    FarmRepository,
    FarmerRepository,
    CultureRepository,
    HarvestRepository,
    TransactionCategoryRepository,
    TransactionRepository,
    OutboxEventRepository,
  ],
})
export default class DatabaseModule {}

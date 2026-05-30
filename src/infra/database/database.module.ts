import { Module } from '@nestjs/common';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';
import OutboxEventRepository from 'domain/application/repositories/OutboxEventRepository';
import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import DrizzleService from './drizzle/drizzle.service';
import DrizzleFarmRepository from './drizzle/repositories/farm.repository';
import DrizzleFarmerRepository from './drizzle/repositories/farmer.repository';
import DrizzleCultureRepository from './drizzle/repositories/culture.repository';
import DrizzleHarvestRepository from './drizzle/repositories/harvest.repository';
import DrizzleTransactionCategoryRepository from './drizzle/repositories/transaction-category.repository';
import DrizzleTransactionRepository from './drizzle/repositories/transaction.repository';
import DrizzleOutboxEventRepository from './drizzle/repositories/outbox-event.repository';
import DrizzleFeedbackRepository from './drizzle/repositories/feedback.repository';
import DrizzlePasswordResetTokenRepository from './drizzle/repositories/password-reset-token.repository';
import DrizzleRefreshTokenRepository from './drizzle/repositories/refreshToken.repository';
import DrizzleUnitOfWork from './drizzle/unit-of-work/drizzle-unit-of-work';

export const DRIZZLE_CONNECTION = Symbol('DRIZZLE_CONNECTION');

@Module({
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE_CONNECTION,
      useFactory: (drizzle: DrizzleService) => drizzle.connection,
      inject: [DrizzleService],
    },
    { provide: FarmRepository, useClass: DrizzleFarmRepository },
    { provide: FarmerRepository, useClass: DrizzleFarmerRepository },
    { provide: CultureRepository, useClass: DrizzleCultureRepository },
    { provide: HarvestRepository, useClass: DrizzleHarvestRepository },
    {
      provide: TransactionCategoryRepository,
      useClass: DrizzleTransactionCategoryRepository,
    },
    { provide: TransactionRepository, useClass: DrizzleTransactionRepository },
    { provide: OutboxEventRepository, useClass: DrizzleOutboxEventRepository },
    { provide: FeedbackRepository, useClass: DrizzleFeedbackRepository },
    {
      provide: PasswordResetTokenRepository,
      useClass: DrizzlePasswordResetTokenRepository,
    },
    {
      provide: RefreshTokenRepository,
      useClass: DrizzleRefreshTokenRepository,
    },
    { provide: UnitOfWork, useClass: DrizzleUnitOfWork },
  ],
  exports: [
    DrizzleService,
    DRIZZLE_CONNECTION,
    FarmRepository,
    FarmerRepository,
    CultureRepository,
    HarvestRepository,
    TransactionCategoryRepository,
    TransactionRepository,
    OutboxEventRepository,
    FeedbackRepository,
    PasswordResetTokenRepository,
    RefreshTokenRepository,
    UnitOfWork,
  ],
})
export default class DatabaseModule {}

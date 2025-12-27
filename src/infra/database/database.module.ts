import { Module } from '@nestjs/common';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import DrizzleService from './drizzle/drizzle.service';
import DrizzleFarmRepository from './drizzle/repositories/farm.repository';
import DrizzleFarmerRepository from './drizzle/repositories/farmer.repository';

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
  ],
  exports: [DrizzleService, FarmRepository, FarmerRepository],
})
export default class DatabaseModule {}

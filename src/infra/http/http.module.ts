import { Module } from '@nestjs/common';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import CryptographyModule from 'infra/cryptography/cryptography.module';
import DatabaseModule from 'infra/database/database.module';
import AppPushUseCase from 'domain/application/use-cases/app/push';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import ListHarvestsByFarm from 'domain/application/use-cases/app/list-harvests-by-farm';
import ListTransactionsByFarm from 'domain/application/use-cases/app/list-transactions-by-farm';
import HealthCheckController from './controllers/health/health-check.controller';
import AuthenticateController from './controllers/auth/authenticate.controller';
import RegisterFarmerController from './controllers/auth/register-farmer.controller';
import PushController from './controllers/app/push.controller';
import PullController from './controllers/app/pull.controller';
import GetHarvestsController from './controllers/harvests/get-harvests.controller';
import GetTransactionsController from './controllers/transactions/get-transactions.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    HealthCheckController,
    PushController,
    PullController,
    AuthenticateController,
    RegisterFarmerController,
    GetHarvestsController,
    GetTransactionsController,
  ],
  providers: [
    LoginFarmerByEmail,
    RegisterUserUseCase,
    AppPushUseCase,
    AppPullUseCase,
    ListHarvestsByFarm,
    ListTransactionsByFarm,
  ],
})
export default class HttpModule {}

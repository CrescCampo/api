import { Module } from '@nestjs/common';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import CryptographyModule from 'infra/cryptography/cryptography.module';
import DatabaseModule from 'infra/database/database.module';
import AppPushUseCase from 'domain/application/use-cases/app/push';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import HealthCheckController from './controllers/health/health-check.controller';
import AuthenticateController from './controllers/auth/authenticate.controller';
import RegisterFarmerController from './controllers/auth/register-farmer.controller';
import PushController from './controllers/app/push.controller';
import PullController from './controllers/app/pull.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AuthenticateController,
    RegisterFarmerController,
    HealthCheckController,
    PushController,
    PullController,
  ],
  providers: [
    LoginFarmerByEmail,
    RegisterUserUseCase,
    AppPushUseCase,
    AppPullUseCase,
  ],
})
export default class HttpModule {}

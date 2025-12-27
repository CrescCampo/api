import { Module } from '@nestjs/common';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import CryptographyModule from 'infra/cryptography/cryptography.module';
import DatabaseModule from 'infra/database/database.module';
import HealthCheckController from './controllers/health/health-check.controller';
import AuthenticateController from './controllers/auth/authenticate.controller';
import RegisterFarmerController from './controllers/auth/register-farmer.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    AuthenticateController,
    RegisterFarmerController,
    HealthCheckController,
  ],
  providers: [LoginFarmerByEmail, RegisterUserUseCase],
})
export default class HttpModule {}

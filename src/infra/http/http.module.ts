import { Module } from '@nestjs/common';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import CryptographyModule from 'infra/cryptography/cryptography.module';
import DatabaseModule from 'infra/database/database.module';
import HealthCheckController from './controllers/health/health-check.controller';
import AuthenticateController from './controllers/auth/authenticate.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [AuthenticateController, HealthCheckController],
  providers: [LoginFarmerByEmail],
})
export default class HttpModule {}

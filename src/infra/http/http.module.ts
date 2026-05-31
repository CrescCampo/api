import { Module } from '@nestjs/common';
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
import RefreshTokenUseCase from 'domain/application/use-cases/auth/refresh-token';
import RegisterUserUseCase from 'domain/application/use-cases/auth/register-farmer-by-email';
import CryptographyModule from 'infra/cryptography/cryptography.module';
import DatabaseModule from 'infra/database/database.module';
import GatewaysModule from 'infra/gateways/gateways.module';
import TracingModule from 'infra/tracing/tracing.module';
import AppPushUseCase from 'domain/application/use-cases/app/push';
import AppPullUseCase from 'domain/application/use-cases/app/pull';
import ListHarvestsByFarm from 'domain/application/use-cases/harvests/list-harvests-by-farm';
import ListTransactionsByFarm from 'domain/application/use-cases/transactions/list-transactions-by-farm';
import ListTransactionsByHarvest from 'domain/application/use-cases/transactions/list-transactions-by-harvest';
import DeleteTransaction from 'domain/application/use-cases/transactions/delete-transaction';
import EditTransaction from 'domain/application/use-cases/transactions/edit-transaction';
import EditHarvestName from 'domain/application/use-cases/harvests/edit-harvest-name';
import SendFeedbackUseCase from 'domain/application/use-cases/feedbacks/send-feedback';
import UpdateFarmerPhone from 'domain/application/use-cases/farmers/update-farmer-phone';
import PasswordResetChangeUseCase from 'domain/application/use-cases/farmers/request-password-reset';
import ResetPasswordUseCase from 'domain/application/use-cases/farmers/reset-password';
import HealthCheckController from './controllers/health/health-check.controller';
import AuthenticateController from './controllers/auth/authenticate.controller';
import RegisterFarmerController from './controllers/auth/register-farmer.controller';
import RefreshTokenController from './controllers/auth/refresh-token.controller';
import PushController from './controllers/app/push.controller';
import PullController from './controllers/app/pull.controller';
import GetHarvestsController from './controllers/harvests/get-harvests.controller';
import GetHarvestTransactionsController from './controllers/harvests/get-harvest-transactions.controller';
import GetTransactionsController from './controllers/transactions/get-transactions.controller';
import DeleteTransactionController from './controllers/transactions/delete-transaction.controller';
import EditTransactionController from './controllers/transactions/edit-transaction.controller';
import EditHarvestNameController from './controllers/harvests/edit-harvest-name.controller';
import SendFeedbackController from './controllers/feedbacks/send-feedback.controller';
import UpdateFarmerPhoneController from './controllers/farmers/update-farmer-phone.controller';
import RequestPasswordResetController from './controllers/farmers/request-password-reset.controller';
import ResetPasswordController from './controllers/farmers/reset-password.controller';

@Module({
  imports: [DatabaseModule, CryptographyModule, GatewaysModule, TracingModule],
  controllers: [
    HealthCheckController,
    PushController,
    PullController,
    AuthenticateController,
    RegisterFarmerController,
    RefreshTokenController,
    GetHarvestsController,
    GetHarvestTransactionsController,
    GetTransactionsController,
    DeleteTransactionController,
    EditTransactionController,
    EditHarvestNameController,
    SendFeedbackController,
    UpdateFarmerPhoneController,
    RequestPasswordResetController,
    ResetPasswordController,
  ],
  providers: [
    LoginFarmerByEmail,
    RefreshTokenUseCase,
    RegisterUserUseCase,
    AppPushUseCase,
    AppPullUseCase,
    ListHarvestsByFarm,
    ListTransactionsByFarm,
    ListTransactionsByHarvest,
    DeleteTransaction,
    EditTransaction,
    EditHarvestName,
    SendFeedbackUseCase,
    UpdateFarmerPhone,
    PasswordResetChangeUseCase,
    ResetPasswordUseCase,
  ],
})
export default class HttpModule {}

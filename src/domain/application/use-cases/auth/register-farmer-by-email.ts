import HashGenerator from 'domain/application/cryptography/hash-generator';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import VerificationEmailSender from 'domain/application/email/verification-email-sender';
import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import AccountCreatedNotifier from 'domain/application/notifications/account-created-notifier';
import Tracer from 'domain/application/tracing/tracer';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';
import { Injectable } from '@nestjs/common';

export interface Input {
  name: string;
  email: string;
  password: string;
  inviteCode?: string | null;
}

export interface Output {
  userId: string;
}

@Injectable()
export default class RegisterUserUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly farmerProvisioner: FarmerProvisioner,
    private readonly hashGenerator: HashGenerator,
    private readonly otpGenerator: OtpGenerator,
    private readonly emailVerificationCodeRepository: EmailVerificationCodeRepository,
    private readonly verificationEmailSender: VerificationEmailSender,
    private readonly unitOfWork: UnitOfWork,
    private readonly tracer: Tracer,
    private readonly accountCreatedNotifier: AccountCreatedNotifier,
  ) {}

  async execute(input: Input): Promise<Output> {
    return this.tracer.startActiveSpan('account.create', async span => {
      const existingFarmer = await this.farmerRepository.findByEmail(
        input.email,
      );

      if (existingFarmer) {
        throw new UserAlreadyExistsError();
      }

      const hashedPassword = await this.hashGenerator.hash(input.password);

      const { plain: verificationCode, hash: codeHash } =
        await this.otpGenerator.generate();

      const result = await this.unitOfWork.run(async () => {
        const farmer = await this.farmerProvisioner.provision({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          inviteCode: input.inviteCode,
        });

        const emailVerificationCode = EmailVerificationCode.create({
          farmerId: farmer.id,
          codeHash,
        });

        await this.emailVerificationCodeRepository.save(emailVerificationCode);

        span.setAttributes({
          'account.user_id': farmer.id,
          'account.farm_id': farmer.farmId,
        });

        return {
          userId: farmer.id,
          name: farmer.firstName,
        };
      });

      this.accountCreatedNotifier
        .notifyAccountCreated({ name: input.name, email: input.email })
        .catch(() => undefined);

      this.verificationEmailSender
        .sendVerificationEmail({
          to: input.email,
          name: result.name,
          code: verificationCode,
        })
        .catch(() => undefined);

      return {
        userId: result.userId,
      };
    });
  }
}

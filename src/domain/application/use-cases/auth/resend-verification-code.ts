import { Injectable } from '@nestjs/common';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import VerificationEmailSender from 'domain/application/email/verification-email-sender';
import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';

const RESEND_COOLDOWN_MS = 60_000;

export interface Input {
  email: string;
}

@Injectable()
export default class ResendVerificationCodeUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly emailVerificationCodeRepository: EmailVerificationCodeRepository,
    private readonly otpGenerator: OtpGenerator,
    private readonly verificationEmailSender: VerificationEmailSender,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<void> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer || farmer.disabled || farmer.emailVerified) {
      return;
    }

    const activeCode =
      await this.emailVerificationCodeRepository.findActiveByFarmerId(
        farmer.id,
      );

    if (
      activeCode &&
      Date.now() - activeCode.createdAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return;
    }

    const { plain, hash } = await this.otpGenerator.generate();

    await this.unitOfWork.run(async () => {
      if (activeCode) {
        activeCode.invalidate();
        await this.emailVerificationCodeRepository.save(activeCode);
      }

      const emailVerificationCode = EmailVerificationCode.create({
        farmerId: farmer.id,
        codeHash: hash,
      });

      await this.emailVerificationCodeRepository.save(emailVerificationCode);

      await this.verificationEmailSender.sendVerificationEmail({
        to: farmer.email,
        name: farmer.firstName,
        code: plain,
      });
    });
  }
}

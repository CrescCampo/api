import { Injectable } from '@nestjs/common';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import EmailAlreadyVerifiedError from 'domain/application/errors/auth/EmailAlreadyVerifiedError';
import InvalidVerificationCodeError from 'domain/application/errors/auth/InvalidVerificationCodeError';
import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import SessionIssuer from 'domain/application/services/session-issuer';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface Input {
  email: string;
  code: string;
}

export interface Output {
  userId: string;
  token: string;
  refreshToken: string;
  name: string;
  email: string;
  phone: string | null;
  farmId: string;
  hasPassword: boolean;
}

@Injectable()
export default class VerifyEmailUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly emailVerificationCodeRepository: EmailVerificationCodeRepository,
    private readonly otpGenerator: OtpGenerator,
    private readonly sessionIssuer: SessionIssuer,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Output> {
    const existingFarmer = await this.farmerRepository.findByEmail(input.email);

    if (!existingFarmer || existingFarmer.disabled) {
      throw new InvalidVerificationCodeError();
    }

    if (existingFarmer.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    const result = await this.unitOfWork.run(async () => {
      const farmer = await this.farmerRepository.findByIdForUpdate(
        existingFarmer.id,
      );

      if (!farmer || farmer.disabled) {
        return { status: 'invalid' as const };
      }

      if (farmer.emailVerified) {
        return { status: 'already-verified' as const };
      }

      const verificationCode =
        await this.emailVerificationCodeRepository.findActiveByFarmerIdForUpdate(
          farmer.id,
        );

      if (!verificationCode || !verificationCode.isUsable) {
        return { status: 'invalid' as const };
      }

      const isCodeValid =
        this.otpGenerator.hash(input.code) === verificationCode.codeHash;

      if (!isCodeValid) {
        verificationCode.registerFailedAttempt();

        await this.emailVerificationCodeRepository.save(verificationCode);

        return { status: 'invalid' as const };
      }

      farmer.verifyEmail();
      farmer.logged();
      verificationCode.markAsUsed();

      const session = await this.sessionIssuer.issue(farmer);

      await this.farmerRepository.save(farmer);
      await this.emailVerificationCodeRepository.save(verificationCode);
      await this.refreshTokenRepository.save(session.refreshToken);

      return { status: 'verified' as const, session, farmer };
    });

    if (result.status === 'already-verified') {
      throw new EmailAlreadyVerifiedError();
    }

    if (result.status !== 'verified') {
      throw new InvalidVerificationCodeError();
    }

    const { session, farmer } = result;

    return {
      userId: farmer.id,
      token: session.token,
      refreshToken: session.refreshTokenPlain,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      farmId: farmer.farmId,
      hasPassword: farmer.hasPassword,
    };
  }
}

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
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer || farmer.disabled) {
      throw new InvalidVerificationCodeError();
    }

    if (farmer.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    const session = await this.unitOfWork.run(async () => {
      const verificationCode =
        await this.emailVerificationCodeRepository.findActiveByFarmerIdForUpdate(
          farmer.id,
        );

      if (!verificationCode || !verificationCode.isUsable) {
        return null;
      }

      const isCodeValid =
        this.otpGenerator.hash(input.code) === verificationCode.codeHash;

      if (!isCodeValid) {
        verificationCode.registerFailedAttempt();

        await this.emailVerificationCodeRepository.save(verificationCode);

        return null;
      }

      farmer.verifyEmail();
      farmer.logged();
      verificationCode.markAsUsed();

      const issuedSession = await this.sessionIssuer.issue(farmer);

      await this.farmerRepository.save(farmer);
      await this.emailVerificationCodeRepository.save(verificationCode);
      await this.refreshTokenRepository.save(issuedSession.refreshToken);

      return issuedSession;
    });

    if (!session) {
      throw new InvalidVerificationCodeError();
    }

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

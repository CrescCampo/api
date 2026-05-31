import { Injectable } from '@nestjs/common';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import InvalidPasswordResetTokenError from 'domain/application/errors/auth/InvalidPasswordResetTokenError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface ResetPasswordUseCaseInput {
  token: string;
  newPassword: string;
}

@Injectable()
export default class ResetPasswordUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly hashGenerator: HashGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ResetPasswordUseCaseInput): Promise<void> {
    const tokenHash = this.tokenGenerator.hash(input.token);

    const passwordResetToken =
      await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!passwordResetToken || !passwordResetToken.isUsable) {
      throw new InvalidPasswordResetTokenError();
    }

    const farmer = await this.farmerRepository.findById(
      passwordResetToken.farmerId,
    );

    if (!farmer || farmer.disabled) {
      throw new InvalidPasswordResetTokenError();
    }

    const hashedPassword = await this.hashGenerator.hash(input.newPassword);

    await this.unitOfWork.run(async () => {
      farmer.password = hashedPassword;
      passwordResetToken.markAsUsed();

      await this.farmerRepository.save(farmer);
      await this.passwordResetTokenRepository.save(passwordResetToken);
    });
  }
}

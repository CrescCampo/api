import { Injectable } from '@nestjs/common';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import ConfigGateway from 'domain/application/gateways/config-gateway';
import EmailGateway from 'domain/application/gateways/email-gateway';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';

export interface PasswordResetChangeUseCaseInput {
  email: string;
  userAgent: string;
  requestIp: string;
}

@Injectable()
export default class PasswordResetChangeUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly tokenGenerator: TokenGenerator,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly configGateway: ConfigGateway,
    private readonly emailGateway: EmailGateway,
  ) {}

  async execute(input: PasswordResetChangeUseCaseInput): Promise<void> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer) {
      return;
    }

    await this.unitOfWork.run(async () => {
      const { passwordResetTokenTtlInMinutes, passwordResetUrl } =
        this.configGateway.get();

      const { plain, hash } = await this.tokenGenerator.generate();

      const passwordResetToken = PasswordResetToken.create({
        farmerId: farmer.id,
        tokenHash: hash,
        ttlMinutes: passwordResetTokenTtlInMinutes,
        requestIp: input.requestIp,
        userAgent: input.userAgent,
      });

      await this.passwordResetTokenRepository.save(passwordResetToken);

      await this.emailGateway.sendResetPasswordEmail({
        resetPasswordPageLink: passwordResetUrl(plain),
      });
    });
  }
}

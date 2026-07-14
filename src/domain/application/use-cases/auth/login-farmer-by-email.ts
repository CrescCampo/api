import { Injectable } from '@nestjs/common';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import EmailNotVerifiedError from 'domain/application/errors/auth/EmailNotVerifiedError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import SessionIssuer from 'domain/application/services/session-issuer';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface Input {
  email: string;
  password: string;
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
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly sessionIssuer: SessionIssuer,
    private readonly unitOfWork: UnitOfWork,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer || farmer.password === null) {
      throw new WrongCredentialsError();
    }

    const isPasswordValid = await this.hashComparer.compare(
      input.password,
      farmer.password,
    );

    if (!isPasswordValid) {
      throw new WrongCredentialsError();
    }

    if (farmer.disabled) {
      throw new WrongCredentialsError();
    }

    if (!farmer.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    farmer.logged();

    if (farmer.password.startsWith('$2a$08$')) {
      farmer.password = await this.hashGenerator.hash(input.password);
    }

    const { token, refreshTokenPlain, refreshToken } =
      await this.sessionIssuer.issue(farmer);

    await this.unitOfWork.run(async () => {
      await this.farmerRepository.save(farmer);
      await this.refreshTokenRepository.save(refreshToken);
    });

    return {
      userId: farmer.id,
      token,
      refreshToken: refreshTokenPlain,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      farmId: farmer.farmId,
      hasPassword: farmer.hasPassword,
    };
  }
}

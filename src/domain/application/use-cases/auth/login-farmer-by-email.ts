import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';

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
}

@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly encrypter: Encrypter,
    private readonly unitOfWork: UnitOfWork,
    private readonly tokenGenerator: TokenGenerator,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer) {
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

    farmer.logged();

    if (farmer.password.startsWith('$2a$08$')) {
      farmer.password = await this.hashGenerator.hash(input.password);
    }

    const { plain, hash } = await this.tokenGenerator.generate();

    const refreshToken = RefreshToken.create({
      farmerId: farmer.id,
      hash,
    });

    await this.unitOfWork.run(async () => {
      await this.farmerRepository.save(farmer);
      await this.refreshTokenRepository.save(refreshToken);
    });

    const token = await this.encrypter.encrypt({
      farmId: farmer.farmId,
      id: farmer.id,
      email: farmer.email,
      name: farmer.name,
      phone: farmer.phone,
      tv: farmer.tokenVersion,
      sessionId: refreshToken.familyId,
    });

    return {
      userId: farmer.id,
      token,
      refreshToken: plain,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      farmId: farmer.farmId,
    };
  }
}

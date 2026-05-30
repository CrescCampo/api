import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import InvalidTokenError from 'domain/application/errors/auth/InvalidTokenError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface IRefreshTokenInputDTO {
  plain: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface IRefreshTokenOutputDTO {
  token: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export default class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly farmerRepository: FarmerRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly encrypter: Encrypter,
  ) {}

  async execute(input: IRefreshTokenInputDTO): Promise<IRefreshTokenOutputDTO> {
    const incomingHash = this.tokenGenerator.hash(input.plain);

    const currentRefreshToken =
      await this.refreshTokenRepository.findByHash(incomingHash);

    if (!currentRefreshToken) {
      throw new InvalidTokenError();
    }

    if (currentRefreshToken.detectReuse()) {
      await this.unitOfWork.run(() =>
        this.refreshTokenRepository.revokeFamily(currentRefreshToken.familyId),
      );
      throw new InvalidTokenError();
    }

    if (!currentRefreshToken.isUsable) {
      throw new InvalidTokenError();
    }

    const farmer = await this.farmerRepository.findById(
      currentRefreshToken.farmerId,
    );

    if (!farmer) {
      await this.unitOfWork.run(() =>
        this.refreshTokenRepository.revokeFamily(currentRefreshToken.familyId),
      );
      throw new InvalidTokenError();
    }

    const { plain: newPlain, hash: newHash } =
      await this.tokenGenerator.generate();

    const nextToken = currentRefreshToken.rotate(
      newHash,
      input.userAgent,
      input.ipAddress,
    );

    await this.unitOfWork.run(async () => {
      await this.refreshTokenRepository.save(currentRefreshToken);
      await this.refreshTokenRepository.save(nextToken);
    });

    const token = await this.encrypter.encrypt({
      farmId: farmer.farmId,
      id: farmer.id,
      email: farmer.email,
      name: farmer.name,
      phone: farmer.phone,
      tv: farmer.tokenVersion,
      sessionId: nextToken.familyId,
    });

    return {
      token,
      refreshToken: newPlain,
      refreshTokenExpiresAt: nextToken.expiresAt,
    };
  }
}

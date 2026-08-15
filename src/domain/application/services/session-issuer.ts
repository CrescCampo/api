import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import Farmer from 'domain/enterprise/entities/Farmer';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';

export interface IssuedSession {
  token: string;
  refreshTokenPlain: string;
  refreshToken: RefreshToken;
}

@Injectable()
export default class SessionIssuer {
  constructor(
    private readonly tokenGenerator: TokenGenerator,
    private readonly encrypter: Encrypter,
  ) {}

  async issue(farmer: Farmer): Promise<IssuedSession> {
    const { plain, hash } = await this.tokenGenerator.generate();

    const refreshToken = RefreshToken.create({
      farmerId: farmer.id,
      hash,
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
      token,
      refreshTokenPlain: plain,
      refreshToken,
    };
  }
}

import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import EmailNotVerifiedByProviderError from 'domain/application/errors/auth/EmailNotVerifiedByProviderError';
import InvalidGoogleTokenError from 'domain/application/errors/auth/InvalidGoogleTokenError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import GoogleTokenVerifier from 'domain/application/gateways/google-token-verifier';
import AccountCreatedNotifier from 'domain/application/notifications/account-created-notifier';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Farmer from 'domain/enterprise/entities/Farmer';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';

export interface Input {
  idToken: string;
  inviteCode?: string | null;
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
export default class LoginFarmerWithGoogle {
  constructor(
    private readonly googleTokenVerifier: GoogleTokenVerifier,
    private readonly farmerRepository: FarmerRepository,
    private readonly farmerProvisioner: FarmerProvisioner,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly encrypter: Encrypter,
    private readonly unitOfWork: UnitOfWork,
    private readonly accountCreatedNotifier: AccountCreatedNotifier,
  ) {}

  async execute(input: Input): Promise<Output> {
    const googleUser = await this.googleTokenVerifier.verify(input.idToken);

    if (!googleUser.emailVerified) {
      throw new EmailNotVerifiedByProviderError();
    }

    let farmer = await this.farmerRepository.findByGoogleId(googleUser.sub);

    if (!farmer) {
      farmer = await this.farmerRepository.findByEmail(googleUser.email);
    }

    if (farmer?.disabled) {
      throw new WrongCredentialsError();
    }

    if (farmer?.googleId && farmer.googleId !== googleUser.sub) {
      throw new InvalidGoogleTokenError();
    }

    const isNewAccount = !farmer;
    const { plain, hash } = await this.tokenGenerator.generate();

    const { persistedFarmer, refreshToken } = await this.unitOfWork.run(
      async () => {
        const resolvedFarmer =
          farmer ??
          (await this.farmerProvisioner.provision({
            name: googleUser.name ?? googleUser.email,
            email: googleUser.email,
            googleId: googleUser.sub,
            inviteCode: input.inviteCode,
          }));

        if (!resolvedFarmer.googleId) {
          resolvedFarmer.linkGoogle(googleUser.sub);
        }

        resolvedFarmer.logged();

        const newRefreshToken = RefreshToken.create({
          farmerId: resolvedFarmer.id,
          hash,
        });

        await this.farmerRepository.save(resolvedFarmer);
        await this.refreshTokenRepository.save(newRefreshToken);

        return {
          persistedFarmer: resolvedFarmer,
          refreshToken: newRefreshToken,
        };
      },
    );

    if (isNewAccount) {
      this.accountCreatedNotifier
        .notifyAccountCreated({
          name: persistedFarmer.name,
          email: persistedFarmer.email,
        })
        .catch(() => undefined);
    }

    const token = await this.encrypter.encrypt({
      farmId: persistedFarmer.farmId,
      id: persistedFarmer.id,
      email: persistedFarmer.email,
      name: persistedFarmer.name,
      phone: persistedFarmer.phone,
      tv: persistedFarmer.tokenVersion,
      sessionId: refreshToken.familyId,
    });

    return this.buildOutput(persistedFarmer, token, plain);
  }

  private buildOutput(
    farmer: Farmer,
    token: string,
    refreshToken: string,
  ): Output {
    return {
      userId: farmer.id,
      token,
      refreshToken,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      farmId: farmer.farmId,
      hasPassword: farmer.hasPassword,
    };
  }
}

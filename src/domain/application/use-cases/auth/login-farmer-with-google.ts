import { Injectable } from '@nestjs/common';
import EmailNotVerifiedByProviderError from 'domain/application/errors/auth/EmailNotVerifiedByProviderError';
import InvalidGoogleTokenError from 'domain/application/errors/auth/InvalidGoogleTokenError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import GoogleTokenVerifier from 'domain/application/gateways/google-token-verifier';
import AccountCreatedNotifier from 'domain/application/notifications/account-created-notifier';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import SessionIssuer from 'domain/application/services/session-issuer';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Farmer from 'domain/enterprise/entities/Farmer';

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
    private readonly sessionIssuer: SessionIssuer,
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

    const { persistedFarmer, token, refreshTokenPlain } =
      await this.unitOfWork.run(async () => {
        const resolvedFarmer =
          farmer ??
          (await this.farmerProvisioner.provision({
            name: googleUser.name ?? googleUser.email,
            email: googleUser.email,
            googleId: googleUser.sub,
            emailVerified: true,
            inviteCode: input.inviteCode,
          }));

        if (!resolvedFarmer.googleId) {
          resolvedFarmer.linkGoogle(googleUser.sub);
        }

        if (!resolvedFarmer.emailVerified) {
          resolvedFarmer.verifyEmail();
        }

        resolvedFarmer.logged();

        const session = await this.sessionIssuer.issue(resolvedFarmer);

        await this.farmerRepository.save(resolvedFarmer);
        await this.refreshTokenRepository.save(session.refreshToken);

        return {
          persistedFarmer: resolvedFarmer,
          token: session.token,
          refreshTokenPlain: session.refreshTokenPlain,
        };
      });

    if (isNewAccount) {
      this.accountCreatedNotifier
        .notifyAccountCreated({
          name: persistedFarmer.name,
          email: persistedFarmer.email,
        })
        .catch(() => undefined);
    }

    return this.buildOutput(persistedFarmer, token, refreshTokenPlain);
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

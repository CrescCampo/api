import { Injectable } from '@nestjs/common';
import GoogleTokenVerifier, {
  GoogleUserInfo,
} from 'domain/application/gateways/google-token-verifier';
import InvalidGoogleTokenError from 'domain/application/errors/auth/InvalidGoogleTokenError';
import OAuthNotConfiguredError from 'domain/application/errors/auth/OAuthNotConfiguredError';
import config from 'infra/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export default class GoogleOAuthTokenVerifier implements GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  async verify(idToken: string): Promise<GoogleUserInfo> {
    const audience = config.google.clientIds;

    if (audience.length === 0) {
      throw new OAuthNotConfiguredError();
    }

    let payload;

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch {
      throw new InvalidGoogleTokenError();
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new InvalidGoogleTokenError();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name ?? null,
    };
  }
}

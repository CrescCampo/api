import { Injectable, Logger } from '@nestjs/common';
import EmailGateway from 'domain/application/gateways/email-gateway';

interface SendResetPasswordEmailInput {
  resetPasswordPageLink: string;
}

@Injectable()
export default class ResendEmailGateway extends EmailGateway {
  private readonly logger = new Logger(ResendEmailGateway.name);

  async sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<null> {
    this.logger.log(
      `Reset password email link: ${input.resetPasswordPageLink}`,
    );
    return null;
  }
}

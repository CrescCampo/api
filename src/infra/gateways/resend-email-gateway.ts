import { Injectable, Logger } from '@nestjs/common';
import EmailGateway, {
  SendResetPasswordEmailInput,
} from 'domain/application/gateways/email-gateway';
import config from 'infra/config';
import { Resend } from 'resend';

@Injectable()
export default class ResendEmailGateway extends EmailGateway {
  private readonly logger = new Logger(ResendEmailGateway.name);

  constructor(private readonly resend: Resend) {
    super();
  }

  async sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<void> {
    const { to, resetPasswordPageLink, name } = input;
    const { error } = await this.resend.emails.send({
      to,
      template: {
        id: config.resetPassword.resendTemplateAlias,
        variables: {
          name,
          reset_url: resetPasswordPageLink,
        },
      },
    });

    if (error) {
      this.logger.error('Failed to send reset password email', error);
      throw new Error(error.message);
    }
  }
}

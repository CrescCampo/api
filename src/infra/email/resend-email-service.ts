import { Injectable, Logger } from '@nestjs/common';
import ResetPasswordEmailSender, {
  SendResetPasswordEmailInput,
} from 'domain/application/email/reset-password-email-sender';
import config from 'infra/config';
import { Resend } from 'resend';

@Injectable()
export default class ResendEmailService implements ResetPasswordEmailSender {
  private readonly logger = new Logger(ResendEmailService.name);

  constructor(private readonly resend: Resend) {}

  async sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<void> {
    const { to, token, name } = input;
    const resetPasswordPageLink = config.resetPassword.passwordResetUrl(token);
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

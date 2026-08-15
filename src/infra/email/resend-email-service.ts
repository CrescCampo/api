import { Injectable, Logger } from '@nestjs/common';
import ResetPasswordEmailSender, {
  SendResetPasswordEmailInput,
} from 'domain/application/email/reset-password-email-sender';
import VerificationEmailSender, {
  SendVerificationEmailInput,
} from 'domain/application/email/verification-email-sender';
import config from 'infra/config';
import { Resend } from 'resend';

@Injectable()
export default class ResendEmailService
  implements ResetPasswordEmailSender, VerificationEmailSender
{
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

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    const { to, name, code } = input;
    const { error } = await this.resend.emails.send({
      to,
      template: {
        id: config.verifyEmail.resendTemplateAlias,
        variables: {
          name,
          code,
        },
      },
    });

    if (error) {
      this.logger.error('Failed to send verification email', error);
      throw new Error(error.message);
    }
  }
}

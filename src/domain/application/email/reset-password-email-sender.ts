export interface SendResetPasswordEmailInput {
  token: string;
  to: string;
  name: string;
}

export default abstract class ResetPasswordEmailSender {
  abstract sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<void>;
}

export interface SendResetPasswordEmailInput {
  resetPasswordPageLink: string;
  to: string;
  name: string;
}

export default abstract class EmailGateway {
  abstract sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<void>;
}

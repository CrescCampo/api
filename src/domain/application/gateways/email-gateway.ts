interface SendResetPasswordEmailInput {
  resetPasswordPageLink: string;
}

export default abstract class EmailGateway {
  abstract sendResetPasswordEmail(
    input: SendResetPasswordEmailInput,
  ): Promise<null>;
}

export interface SendVerificationEmailInput {
  to: string;
  name: string;
  code: string;
}

export default abstract class VerificationEmailSender {
  abstract sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void>;
}

import { Injectable } from '@nestjs/common';
import VerificationEmailSender, {
  SendVerificationEmailInput,
} from 'domain/application/email/verification-email-sender';

@Injectable()
export default class FakeVerificationEmailSender implements VerificationEmailSender {
  calls: SendVerificationEmailInput[] = [];

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    this.calls.push(input);
  }

  lastCodeFor(email: string): string | undefined {
    const match = [...this.calls].reverse().find(call => call.to === email);
    return match?.code;
  }

  reset(): void {
    this.calls = [];
  }
}

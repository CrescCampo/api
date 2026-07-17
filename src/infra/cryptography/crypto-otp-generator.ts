import { createHmac, randomInt } from 'node:crypto';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import config from 'infra/config';

export default class CryptoOtpGenerator implements OtpGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    const plain = randomInt(0, 1_000_000).toString().padStart(6, '0');
    return { plain, hash: this.hash(plain) };
  }

  hash(plain: string): string {
    return createHmac('sha256', config.verifyEmail.codeSecret)
      .update(plain)
      .digest('hex');
  }
}

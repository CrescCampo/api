import { createHash, randomInt } from 'node:crypto';
import OtpGenerator from 'domain/application/cryptography/otp-generator';

export default class CryptoOtpGenerator implements OtpGenerator {
  async generate(): Promise<{ plain: string; hash: string }> {
    const plain = randomInt(0, 1_000_000).toString().padStart(6, '0');
    return { plain, hash: this.hash(plain) };
  }

  hash(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }
}

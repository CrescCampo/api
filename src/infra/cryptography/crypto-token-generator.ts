import { createHash, randomBytes } from 'node:crypto';
import TokenGenerator from 'domain/application/cryptography/token-generator';

export default class CryptoTokenGenerator implements TokenGenerator {
  private TOKEN_BYTES = 32;

  async generate(): Promise<{ plain: string; hash: string }> {
    const plain = randomBytes(this.TOKEN_BYTES).toString('hex');
    return { plain, hash: this.hash(plain) };
  }

  hash(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }
}

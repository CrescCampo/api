import { randomBytes } from 'node:crypto';
import { hash, compare } from 'bcryptjs';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';

export default class BcryptHasher
  implements HashGenerator, HashComparer, TokenGenerator
{
  private HASH_SALT_LENGTH = 12;

  private TOKEN_BYTES = 32;

  hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compare(plain: string, hashToCompare: string): Promise<boolean> {
    return compare(plain, hashToCompare);
  }

  async generate(): Promise<{ plain: string; hash: string }> {
    const plain = randomBytes(this.TOKEN_BYTES).toString('hex');
    return { plain, hash: await this.hash(plain) };
  }
}

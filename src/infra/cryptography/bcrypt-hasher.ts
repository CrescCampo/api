import { hash, compare } from 'bcryptjs';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';

export default class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_LENGTH = 12;

  hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compare(plain: string, hashToCompare: string): Promise<boolean> {
    return compare(plain, hashToCompare);
  }
}

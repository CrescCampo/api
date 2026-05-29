import { Module } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import JwtEncrypter from './jwt-encrypter';
import BcryptHasher from './bcrypt-hasher';

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher },
    { provide: TokenGenerator, useClass: BcryptHasher },
  ],
  exports: [Encrypter, HashComparer, HashGenerator, TokenGenerator],
})
export default class CryptographyModule {}

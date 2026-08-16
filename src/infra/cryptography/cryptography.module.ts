import { Module } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import TokenGenerator from 'domain/application/cryptography/token-generator';
import OtpGenerator from 'domain/application/cryptography/otp-generator';
import JwtEncrypter from './jwt-encrypter';
import BcryptHasher from './bcrypt-hasher';
import CryptoTokenGenerator from './crypto-token-generator';
import CryptoOtpGenerator from './crypto-otp-generator';

@Module({
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher },
    { provide: TokenGenerator, useClass: CryptoTokenGenerator },
    { provide: OtpGenerator, useClass: CryptoOtpGenerator },
  ],
  exports: [
    Encrypter,
    HashComparer,
    HashGenerator,
    TokenGenerator,
    OtpGenerator,
  ],
})
export default class CryptographyModule {}

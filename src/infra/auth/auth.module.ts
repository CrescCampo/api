import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import config from 'infra/config';
import JwtStrategy from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      privateKey: Buffer.from(config.jwt.privateKeyBase64, 'base64'),
      publicKey: Buffer.from(config.jwt.publicKeyBase64, 'base64'),
      signOptions: { algorithm: 'RS256', expiresIn: config.jwt.expiresIn },
    }),
  ],
  providers: [JwtStrategy],
})
export default class AuthModule {}

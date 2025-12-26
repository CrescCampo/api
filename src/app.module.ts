import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import validateEnv from './infra/env/env.validation';
import HttpModule from './infra/http/http.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    HttpModule,
  ],
  controllers: [],
  providers: [],
})
export default class AppModule {}

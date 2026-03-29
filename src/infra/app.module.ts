import { Module } from '@nestjs/common';

import AuthModule from 'infra/auth/auth.module';
import DatabaseModule from 'infra/database/database.module';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import HttpModule from './http/http.module';
import CryptographyModule from './cryptography/cryptography.module';
import WhatsappProcessorModule from './whatsapp-processor/whatsapp-processor.module';
import config from './config';
import AllExceptionsFilter from './exceptions/all-excpetions.filter';
import LoggerInterceptor from './logs/logger.interceptor';
import winstonConfig from './config/winston.config';

@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    ThrottlerModule.forRoot([
      { ttl: config.app.rateLimit.ttl, limit: config.app.rateLimit.limit },
    ]),
    DatabaseModule,
    AuthModule,
    HttpModule,
    CryptographyModule,
    WhatsappProcessorModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export default class AppModule {}

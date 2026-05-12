import { Module } from '@nestjs/common';

import AuthModule from 'infra/auth/auth.module';
import DatabaseModule, {
  DRIZZLE_CONNECTION,
} from 'infra/database/database.module';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
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
      {
        name: 'global',
        ttl: config.app.rateLimit.ttl,
        limit: config.app.rateLimit.limit,
      },
    ]),
    DatabaseModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [DatabaseModule],
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: DRIZZLE_CONNECTION,
          }),
        }),
      ],
    }),
    AuthModule,
    HttpModule,
    CryptographyModule,
    WhatsappProcessorModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    ThrottlerGuard,
    { provide: APP_GUARD, useExisting: ThrottlerGuard },
  ],
})
export default class AppModule {}

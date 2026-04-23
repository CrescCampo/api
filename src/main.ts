import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import winstonConfig from 'infra/config/winston.config';
import setSwagger from 'infra/http/swagger';
import config from 'infra/config';
import Environment from 'infra/config/Environment';
import AppModule from './infra/app.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });

  app.use(helmet());
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ limit: '100kb', extended: true, parameterLimit: 100 }));
  app.getHttpAdapter().getInstance().set('trust proxy', 'loopback');
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  if (config.app.environment === Environment.PROD) {
    app.enableCors({
      origin: ['https://cresccampo.com.br', 'https://www.cresccampo.com.br'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['content-type', 'authorization'],
      credentials: false,
    });
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  if (config.app.environment !== Environment.PROD) {
    setSwagger(app, config.swagger);
  }

  const port = config.app.port ?? 5000;
  await app.listen(port);
}
bootstrap();

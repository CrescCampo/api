import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import winstonConfig from 'infra/config/winston.config';
import setSwagger from 'infra/http/swagger';
import config from 'infra/config';
import Environment from 'infra/config/Environment';
import AppModule from './app.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);

  if (config.app.environment !== Environment.PROD) {
    setSwagger(app, config.swagger);
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CrescCampo API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = configService.get<number>('PORT') ?? 5000;
  await app.listen(port);
}
bootstrap();

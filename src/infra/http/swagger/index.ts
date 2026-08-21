import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  ADMIN_API_KEY_HEADER,
  ADMIN_API_KEY_SECURITY_SCHEME,
} from 'infra/auth/admin-api-key.guard';
import { SwaggerConfig } from './swagger-config';

function setSwagger(app: INestApplication, params: SwaggerConfig) {
  const config = new DocumentBuilder()
    .setTitle(params.title)
    .setDescription(params.description)
    .setVersion(params.version)
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', in: 'header', name: ADMIN_API_KEY_HEADER },
      ADMIN_API_KEY_SECURITY_SCHEME,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(params.path, app, document);
}

export default setSwagger;

import { Module } from '@nestjs/common';
import ConfigGateway from 'domain/application/gateways/config-gateway';
import EmailGateway from 'domain/application/gateways/email-gateway';
import WhatsAppGateway from 'domain/application/gateways/whatsapp-gateway';
import config from 'infra/config';
import InfraConfigGateway from 'infra/config/gateway';
import { Resend } from 'resend';
import ResendEmailGateway from './resend-email-gateway';
import WhatsAppHttpGateway from './whatsapp-http-gateway';

@Module({
  providers: [
    {
      provide: Resend,
      useFactory: () => new Resend(config.resend.apiKey),
    },
    { provide: WhatsAppGateway, useClass: WhatsAppHttpGateway },
    { provide: EmailGateway, useClass: ResendEmailGateway },
    { provide: ConfigGateway, useClass: InfraConfigGateway },
  ],
  exports: [WhatsAppGateway, EmailGateway, ConfigGateway],
})
export default class GatewaysModule {}

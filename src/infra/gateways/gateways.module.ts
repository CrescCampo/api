import { Module } from '@nestjs/common';
import WhatsAppGateway from 'domain/application/gateways/whatsapp-gateway';
import WhatsAppHttpGateway from './whatsapp-http-gateway';

@Module({
  providers: [{ provide: WhatsAppGateway, useClass: WhatsAppHttpGateway }],
  exports: [WhatsAppGateway],
})
export default class GatewaysModule {}

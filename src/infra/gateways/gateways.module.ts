import { Module } from '@nestjs/common';
import ResetPasswordEmailSender from 'domain/application/email/reset-password-email-sender';
import WhatsAppGateway from 'domain/application/gateways/whatsapp-gateway';
import config from 'infra/config';
import ResendEmailService from 'infra/email/resend-email-service';
import { Resend } from 'resend';
import WhatsAppHttpGateway from './whatsapp-http-gateway';

@Module({
  providers: [
    {
      provide: Resend,
      useFactory: () => new Resend(config.resend.apiKey),
    },
    { provide: WhatsAppGateway, useClass: WhatsAppHttpGateway },
    { provide: ResetPasswordEmailSender, useClass: ResendEmailService },
  ],
  exports: [WhatsAppGateway, ResetPasswordEmailSender],
})
export default class GatewaysModule {}

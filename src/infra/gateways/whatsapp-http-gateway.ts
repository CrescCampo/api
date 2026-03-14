import { Injectable, Logger } from '@nestjs/common';
import WhatsAppGateway, {
  SendMessageRequest,
  SendMessageResponse,
} from 'domain/application/gateways/whatsapp-gateway';
import config from 'infra/config';

@Injectable()
export default class WhatsAppHttpGateway extends WhatsAppGateway {
  private readonly logger = new Logger(WhatsAppHttpGateway.name);

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await fetch(`${config.whatsapp.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.whatsapp.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      this.logger.error(
        `Failed to send WhatsApp message: ${response.status} ${response.statusText}`,
      );
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    return response.json() as Promise<SendMessageResponse>;
  }
}

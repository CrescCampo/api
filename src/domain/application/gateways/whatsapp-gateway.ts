export interface SendMessageRequest {
  phoneNumber: string;
  text: string;
}

export interface SendMessageResponse {
  id: string;
  status: string;
}

export default abstract class WhatsAppGateway {
  abstract sendMessage(
    request: SendMessageRequest,
  ): Promise<SendMessageResponse>;
}

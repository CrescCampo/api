import { Injectable, Logger } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import WhatsAppGateway from 'domain/application/gateways/whatsapp-gateway';

interface UpdateFarmerPhoneRequest {
  farmerId: string;
  phone: string;
}

@Injectable()
export default class UpdateFarmerPhone {
  private readonly logger = new Logger(UpdateFarmerPhone.name);

  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly whatsAppGateway: WhatsAppGateway,
  ) {}

  async execute({ farmerId, phone }: UpdateFarmerPhoneRequest) {
    const farmer = await this.farmerRepository.findById(farmerId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    const isNewPhone = farmer.phone !== phone;

    farmer.phone = phone;

    await this.farmerRepository.save(farmer);

    if (isNewPhone) {
      const phoneNumber = phone.replace('+', '');

      this.whatsAppGateway
        .sendMessage({
          phoneNumber,
          text: `Olá, ${farmer.name}! 🌱 Seja bem-vindo(a) ao CrescCampo! Seu número foi cadastrado com sucesso. A partir de agora, você poderá receber atualizações importantes por aqui.`,
        })
        .catch(error => {
          this.logger.error(error);
          this.logger.error(
            `Failed to send welcome message to farmer ${farmerId}: ${error.message}`,
          );
        });
    }

    return { farmerId: farmer.id };
  }
}

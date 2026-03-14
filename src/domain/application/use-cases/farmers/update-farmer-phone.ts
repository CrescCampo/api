import { Injectable } from '@nestjs/common';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';

interface UpdateFarmerPhoneRequest {
  farmerId: string;
  phone: string;
}

@Injectable()
export default class UpdateFarmerPhone {
  constructor(private readonly farmerRepository: FarmerRepository) {}

  async execute({ farmerId, phone }: UpdateFarmerPhoneRequest) {
    const farmer = await this.farmerRepository.findById(farmerId);

    if (!farmer) {
      throw new FarmerNotFoundError();
    }

    farmer.phone = phone;

    await this.farmerRepository.save(farmer);

    return { farmerId: farmer.id };
  }
}

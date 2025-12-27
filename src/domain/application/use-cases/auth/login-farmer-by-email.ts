import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';

export interface Input {
  email: string;
  password: string;
}

export interface Output {
  userId: string;
  token: string;
}

@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer) {
      throw new WrongCredentialsError();
    }

    const isPasswordValid = await this.hashComparer.compare(
      input.password,
      farmer.password,
    );

    if (!isPasswordValid) {
      throw new WrongCredentialsError();
    }

    if (farmer.disabled) {
      throw new WrongCredentialsError();
    }

    farmer.logged();

    await this.farmerRepository.save(farmer);

    const token = await this.encrypter.encrypt({
      farmId: farmer.farmId,
      id: farmer.id,
      email: farmer.email,
      name: farmer.name,
    });

    return {
      userId: farmer.id,
      token,
    };
  }
}

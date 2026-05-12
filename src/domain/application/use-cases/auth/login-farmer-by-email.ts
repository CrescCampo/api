import { Injectable } from '@nestjs/common';
import Encrypter from 'domain/application/cryptography/encrypter';
import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export interface Input {
  email: string;
  password: string;
}

export interface Output {
  userId: string;
  token: string;
  name: string;
  email: string;
  phone: string | null;
  farmId: string;
}

@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
    private readonly encrypter: Encrypter,
    private readonly unitOfWork: UnitOfWork,
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

    if (farmer.password.startsWith('$2a$08$')) {
      farmer.password = await this.hashGenerator.hash(input.password);
    }

    await this.unitOfWork.run(async () => {
      await this.farmerRepository.save(farmer);
    });

    const token = await this.encrypter.encrypt({
      farmId: farmer.farmId,
      id: farmer.id,
      email: farmer.email,
      name: farmer.name,
      phone: farmer.phone,
    });

    return {
      userId: farmer.id,
      token,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      farmId: farmer.farmId,
    };
  }
}

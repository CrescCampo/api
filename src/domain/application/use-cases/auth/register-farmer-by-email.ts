import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import { IFarmerRepository } from 'domain/application/repositories/IFarmerRepository';
import { IFarmRepository } from 'domain/application/repositories/IFarmRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';

interface Input {
  name: string;
  email: string;
}

interface OutPut {
  userId: string;
}

export default class RegisterUserUseCase {
  constructor(
    private readonly farmerRepository: IFarmerRepository,
    private readonly farmRepository: IFarmRepository,
  ) {}

  async execute(input: Input): Promise<OutPut> {
    const existingFarmer = await this.farmerRepository.findByEmail(input.email);

    if (existingFarmer) {
      throw new UserAlreadyExistsError();
    }

    const farm = Farm.create({});

    await this.farmRepository.save(farm);

    const newFarmer = Farmer.create({
      name: input.name,
      email: input.email,
      farmId: farm.id,
    });

    await this.farmerRepository.save(newFarmer);

    return {
      userId: newFarmer.id,
    };
  }
}

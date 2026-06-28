import HashGenerator from 'domain/application/cryptography/hash-generator';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FarmerProvisioner from 'domain/application/services/farmer-provisioner';
import AccountCreatedNotifier from 'domain/application/notifications/account-created-notifier';
import Tracer from 'domain/application/tracing/tracer';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import { Injectable } from '@nestjs/common';

export interface Input {
  name: string;
  email: string;
  password: string;
}

export interface Output {
  userId: string;
}

@Injectable()
export default class RegisterUserUseCase {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly farmerProvisioner: FarmerProvisioner,
    private readonly hashGenerator: HashGenerator,
    private readonly unitOfWork: UnitOfWork,
    private readonly tracer: Tracer,
    private readonly accountCreatedNotifier: AccountCreatedNotifier,
  ) {}

  async execute(input: Input): Promise<Output> {
    return this.tracer.startActiveSpan('account.create', async span => {
      const existingFarmer = await this.farmerRepository.findByEmail(
        input.email,
      );

      if (existingFarmer) {
        throw new UserAlreadyExistsError();
      }

      const hashedPassword = await this.hashGenerator.hash(input.password);

      const result = await this.unitOfWork.run(async () => {
        const farmer = await this.farmerProvisioner.provision({
          name: input.name,
          email: input.email,
          password: hashedPassword,
        });

        span.setAttributes({
          'account.user_id': farmer.id,
          'account.farm_id': farmer.farmId,
        });

        return {
          userId: farmer.id,
        };
      });

      this.accountCreatedNotifier
        .notifyAccountCreated({ name: input.name, email: input.email })
        .catch(() => undefined);

      return result;
    });
  }
}

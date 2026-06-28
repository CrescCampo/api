import HashComparer from 'domain/application/cryptography/hash-comparer';
import HashGenerator from 'domain/application/cryptography/hash-generator';
import CurrentPasswordRequiredError from 'domain/application/errors/auth/CurrentPasswordRequiredError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import SetFarmerPassword from 'domain/application/use-cases/farmers/set-farmer-password';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed-${plain}`;
  }
}

class FakeHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`;
  }
}

let farmerRepository: InMemoryFarmerRepository;
let unitOfWork: InMemoryUnitOfWork;
let sut: SetFarmerPassword;

const NEW_PASSWORD = 'novaSenha@123';

function makeGoogleOnlyFarmer(): Farmer {
  const farm = Farm.create({});
  return Farmer.create({
    name: 'Maria Clara',
    email: 'maria@example.com',
    farmId: farm.id,
    googleId: 'google-sub-1',
  });
}

describe('SetFarmerPassword', () => {
  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    unitOfWork = new InMemoryUnitOfWork();
    sut = new SetFarmerPassword(
      farmerRepository,
      new FakeHashComparer(),
      new FakeHashGenerator(),
      unitOfWork,
    );
  });

  it('should set a password for a Google-only account without current password', async () => {
    const farmer = makeGoogleOnlyFarmer();
    await farmerRepository.save(farmer);

    await sut.execute({ farmerId: farmer.id, newPassword: NEW_PASSWORD });

    expect(farmerRepository.items[0].password).toBe(`hashed-${NEW_PASSWORD}`);
    expect(farmerRepository.items[0].hasPassword).toBe(true);
  });

  it('should throw when account already has a password and none is provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-old',
    });
    await farmerRepository.save(farmer);

    await expect(
      sut.execute({ farmerId: farmer.id, newPassword: NEW_PASSWORD }),
    ).rejects.toBeInstanceOf(CurrentPasswordRequiredError);
  });

  it('should change the password when the current password matches', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-old',
    });
    await farmerRepository.save(farmer);

    await sut.execute({
      farmerId: farmer.id,
      newPassword: NEW_PASSWORD,
      currentPassword: 'old',
    });

    expect(farmerRepository.items[0].password).toBe(`hashed-${NEW_PASSWORD}`);
  });

  it('should reject when the current password does not match', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria Clara',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed-old',
    });
    await farmerRepository.save(farmer);

    await expect(
      sut.execute({
        farmerId: farmer.id,
        newPassword: NEW_PASSWORD,
        currentPassword: 'wrong',
      }),
    ).rejects.toBeInstanceOf(WrongCredentialsError);
  });

  it('should throw when farmer does not exist', async () => {
    await expect(
      sut.execute({ farmerId: 'missing', newPassword: NEW_PASSWORD }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });
});

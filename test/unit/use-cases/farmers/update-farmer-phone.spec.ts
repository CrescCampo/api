import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import UpdateFarmerPhone from 'domain/application/use-cases/farmers/update-farmer-phone';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryUnitOfWork from '../../unit-of-work/InMemoryUnitOfWork';

const fakeWhatsAppGateway = {
  sendMessage: vi.fn().mockResolvedValue({ id: 'msg-id', status: 'pending' }),
};

let inMemoryFarmerRepository;
let unitOfWork: InMemoryUnitOfWork;
let sut;

describe('UpdateFarmerPhone', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    unitOfWork = new InMemoryUnitOfWork();
    sut = new UpdateFarmerPhone(
      inMemoryFarmerRepository,
      fakeWhatsAppGateway,
      unitOfWork,
    );
    vi.clearAllMocks();
  });

  it('should throw error if farmer does not exist', async () => {
    await expect(
      sut.execute({
        farmerId: 'non-existent-id',
        phone: '+5511999999999',
      }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should update the farmer phone number', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed-password',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({
      farmerId: farmer.id,
      phone: '+5511999999999',
    });

    expect(result.farmerId).toBe(farmer.id);
    expect(inMemoryFarmerRepository.items[0].phone).toBe('+5511999999999');
    expect(inMemoryFarmerRepository.items[0].updatedAt).not.toBeNull();
  });
});

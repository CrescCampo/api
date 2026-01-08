import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import Farmer from 'domain/enterprise/entities/Farmer';
import Farm from 'domain/enterprise/entities/Farm';
import FeedbackCategory from 'domain/enterprise/enums/FeedbackCategory';
import InMemoryFarmerRepository from '../../../../../test/unit/repositories/InMemoryFarmerRepository';
import InMemoryFeedbackRepository from '../../../../../test/unit/repositories/InMemoryFeedbackRepository';
import SendFeedbackUseCase from './send-feedback';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryFeedbackRepository: InMemoryFeedbackRepository;
let sut: SendFeedbackUseCase;

describe('SendFeedbackUseCase', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryFeedbackRepository = new InMemoryFeedbackRepository();
    sut = new SendFeedbackUseCase(
      inMemoryFarmerRepository,
      inMemoryFeedbackRepository,
    );
  });

  it('should throw when farmer does not exist', async () => {
    await expect(
      sut.execute({
        userId: 'missing-user',
        rating: 5,
        description: 'Ok',
        category: FeedbackCategory.DELIVERY,
      }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should create a feedback linked to the farmer', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Joao Paulo',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed-secret',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({
      userId: farmer.id,
      rating: 4,
      description: 'Entrega rapida',
      category: FeedbackCategory.DELIVERY,
    });

    expect(inMemoryFeedbackRepository.items).toHaveLength(1);
    expect(inMemoryFeedbackRepository.items[0].id).toBe(result.feedbackId);
    expect(inMemoryFeedbackRepository.items[0].farmerId).toBe(farmer.id);
    expect(inMemoryFeedbackRepository.items[0].rating).toBe(4);
    expect(inMemoryFeedbackRepository.items[0].description).toBe(
      'Entrega rapida',
    );
    expect(inMemoryFeedbackRepository.items[0].category).toBe(
      FeedbackCategory.DELIVERY,
    );
  });
});

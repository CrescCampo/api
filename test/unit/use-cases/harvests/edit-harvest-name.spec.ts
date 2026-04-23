import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import HarvestNotFoundError from 'domain/application/errors/harvest/HarvestNotFoundError';
import EditHarvestName from 'domain/application/use-cases/harvests/edit-harvest-name';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let sut: EditHarvestName;

describe('EditHarvestName', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    sut = new EditHarvestName(
      inMemoryFarmerRepository,
      inMemoryHarvestRepository,
    );
  });

  it('should throw FarmerNotFoundError when farmer does not exist', async () => {
    await expect(
      sut.execute({
        userId: 'non-existent',
        harvestId: 'harvest-id',
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should throw HarvestNotFoundError when harvest does not exist', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    await expect(
      sut.execute({
        userId: farmer.id,
        harvestId: 'non-existent',
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(HarvestNotFoundError);
  });

  it('should throw HarvestNotFoundError when harvest belongs to another farm', async () => {
    const farm1 = Farm.create({});
    const farm2 = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm1.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Soja', farmId: farm2.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm2.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    await expect(
      sut.execute({
        userId: farmer.id,
        harvestId: harvest.id,
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(HarvestNotFoundError);
  });

  it('should update harvest name', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({
      userId: farmer.id,
      harvestId: harvest.id,
      name: 'Safra 2025 - Atualizada',
    });

    expect(result.harvestId).toBe(harvest.id);
    expect(inMemoryHarvestRepository.items[0].name).toBe(
      'Safra 2025 - Atualizada',
    );
    expect(inMemoryHarvestRepository.items[0].updatedAt).not.toBeNull();
  });

  it('should update name even on finished harvests', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'Maria',
      email: 'maria@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    const culture = Culture.create({ name: 'Milho', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra Finalizada',
      culture,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({
      userId: farmer.id,
      harvestId: harvest.id,
      name: 'Safra Finalizada - Editada',
    });

    expect(result.harvestId).toBe(harvest.id);
    expect(inMemoryHarvestRepository.items[0].name).toBe(
      'Safra Finalizada - Editada',
    );
  });
});

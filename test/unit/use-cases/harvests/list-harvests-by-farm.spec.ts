import Farm from 'domain/enterprise/entities/Farm';
import Farmer from 'domain/enterprise/entities/Farmer';
import Harvest from 'domain/enterprise/entities/Harvest';
import Culture from 'domain/enterprise/entities/Culture';
import ListHarvestsByFarm from 'domain/application/use-cases/harvests/list-harvests-by-farm';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import InMemoryFarmerRepository from '../../repositories/InMemoryFarmerRepository';
import InMemoryHarvestRepository from '../../repositories/InMemoryHarvestRepository';

let inMemoryFarmerRepository: InMemoryFarmerRepository;
let inMemoryHarvestRepository: InMemoryHarvestRepository;
let sut: ListHarvestsByFarm;

describe('ListHarvestsByFarm', () => {
  beforeEach(() => {
    inMemoryFarmerRepository = new InMemoryFarmerRepository();
    inMemoryHarvestRepository = new InMemoryHarvestRepository();
    sut = new ListHarvestsByFarm(
      inMemoryFarmerRepository,
      inMemoryHarvestRepository,
    );
  });

  it('should throw FarmerNotFoundError when farmer does not exist', async () => {
    await expect(
      sut.execute({ userId: 'non-existent' }),
    ).rejects.toBeInstanceOf(FarmerNotFoundError);
  });

  it('should return empty list when no harvests exist', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.harvests).toHaveLength(0);
    expect(result.pagination.meta.totalItems).toBe(0);
    expect(result.pagination.meta.currentPage).toBe(1);
    expect(result.pagination.meta.items).toBe(0);
  });

  it('should return harvests with correct DTO mapping', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date('2025-12-31T00:00:00.000Z');
    const harvest = Harvest.create({
      name: 'Safra 2025',
      culture,
      startDate,
      endDate,
      farmId: farm.id,
      revenue: 1000,
      expenses: 500,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.harvests).toHaveLength(1);
    expect(result.harvests[0].id).toBe(harvest.id);
    expect(result.harvests[0].name).toBe('Safra 2025');
    expect(result.harvests[0].cultureId).toBe(culture.id);
    expect(result.harvests[0].startDate).toBe(startDate.getTime());
    expect(result.harvests[0].endDate).toBe(endDate.getTime());
    expect(result.harvests[0].revenue).toBe(1000);
    expect(result.harvests[0].expenses).toBe(500);
  });

  it('should not include endDate in DTO for active harvests', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvest = Harvest.create({
      name: 'Safra Ativa',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.harvests[0].endDate).toBeUndefined();
  });

  it('should default to page 1 and pageSize 10 when not provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should use provided page and pageSize for pagination', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });

    for (let i = 0; i < 15; i++) {
      const harvest = Harvest.create({
        name: `Safra ${i}`,
        culture,
        startDate: new Date(2025, 0, i + 1),
        farmId: farm.id,
      });
      await inMemoryHarvestRepository.save(harvest);
    }

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({
      userId: farmer.id,
      page: 2,
      pageSize: 5,
    });

    expect(result.harvests).toHaveLength(5);
    expect(result.pagination.meta.currentPage).toBe(2);
    expect(result.pagination.meta.totalItems).toBe(15);
    expect(result.pagination.meta.items).toBe(5);
  });

  it('should fallback to page 1 when invalid page is provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id, page: -1 });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should fallback to pageSize 10 when invalid pageSize is provided', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });

    await inMemoryFarmerRepository.save(farmer);

    const result = await sut.execute({ userId: farmer.id, pageSize: 0 });

    expect(result.pagination.meta.currentPage).toBe(1);
  });

  it('should filter harvests by search term', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const harvestVerao = Harvest.create({
      name: 'Safra Verão',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const harvestInverno = Harvest.create({
      name: 'Safra Inverno',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvestVerao);
    await inMemoryHarvestRepository.save(harvestInverno);

    const result = await sut.execute({ userId: farmer.id, search: 'Verão' });

    expect(result.harvests).toHaveLength(1);
    expect(result.harvests[0].name).toBe('Safra Verão');
    expect(result.pagination.meta.totalItems).toBe(1);
  });

  it('should filter active (non-finished) harvests when active is true', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const activeHarvest = Harvest.create({
      name: 'Ativa',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const finishedHarvest = Harvest.create({
      name: 'Finalizada',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      endDate: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(activeHarvest);
    await inMemoryHarvestRepository.save(finishedHarvest);

    const result = await sut.execute({ userId: farmer.id, active: true });

    expect(result.harvests).toHaveLength(1);
    expect(result.harvests[0].id).toBe(activeHarvest.id);
  });

  it('should filter finished harvests when active is false', async () => {
    const farm = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm.id,
      password: 'hashed',
    });
    const culture = Culture.create({ name: 'Soja', farmId: farm.id });
    const activeHarvest = Harvest.create({
      name: 'Ativa',
      culture,
      startDate: new Date(),
      farmId: farm.id,
    });
    const finishedHarvest = Harvest.create({
      name: 'Finalizada',
      culture,
      startDate: new Date(),
      farmId: farm.id,
      endDate: new Date(),
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(activeHarvest);
    await inMemoryHarvestRepository.save(finishedHarvest);

    const result = await sut.execute({ userId: farmer.id, active: false });

    expect(result.harvests).toHaveLength(1);
    expect(result.harvests[0].id).toBe(finishedHarvest.id);
  });

  it('should only return harvests from the farmer farm', async () => {
    const farm1 = Farm.create({});
    const farm2 = Farm.create({});
    const farmer = Farmer.create({
      name: 'João',
      email: 'joao@example.com',
      farmId: farm1.id,
      password: 'hashed',
    });
    const culture1 = Culture.create({ name: 'Soja', farmId: farm1.id });
    const culture2 = Culture.create({ name: 'Milho', farmId: farm2.id });
    const harvest1 = Harvest.create({
      name: 'Safra Farm 1',
      culture: culture1,
      startDate: new Date(),
      farmId: farm1.id,
    });
    const harvest2 = Harvest.create({
      name: 'Safra Farm 2',
      culture: culture2,
      startDate: new Date(),
      farmId: farm2.id,
    });

    await inMemoryFarmerRepository.save(farmer);
    await inMemoryHarvestRepository.save(harvest1);
    await inMemoryHarvestRepository.save(harvest2);

    const result = await sut.execute({ userId: farmer.id });

    expect(result.harvests).toHaveLength(1);
    expect(result.harvests[0].id).toBe(harvest1.id);
  });
});

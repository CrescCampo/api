import Harvest from 'domain/enterprise/entities/Harvest';

export default abstract class HarvestRepository {
  abstract save(harvest: Harvest): Promise<void>;

  abstract exists(id: string): Promise<boolean>;
}

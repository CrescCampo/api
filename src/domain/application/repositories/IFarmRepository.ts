import Farm from 'domain/enterprise/entities/Farm';

export interface IFarmRepository {
  save(farm: Farm): Promise<void>;
}

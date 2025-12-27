import Farm from 'domain/enterprise/entities/Farm';

export default abstract class FarmRepository {
  abstract save(farm: Farm): Promise<void>;
}

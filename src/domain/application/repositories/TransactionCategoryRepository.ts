import TransactionCategory from 'domain/enterprise/entities/TransactionCategory';

export default abstract class TransactionCategoryRepository {
  abstract save(category: TransactionCategory): Promise<void>;

  abstract findById(id: string): Promise<TransactionCategory | null>;
}

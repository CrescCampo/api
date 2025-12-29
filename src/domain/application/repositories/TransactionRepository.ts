import Transaction from 'domain/enterprise/entities/Transaction';

export default abstract class TransactionRepository {
  abstract save(transaction: Transaction): Promise<void>;
}

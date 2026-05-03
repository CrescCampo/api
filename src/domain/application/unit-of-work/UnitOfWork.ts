import CultureRepository from 'domain/application/repositories/CultureRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import FeedbackRepository from 'domain/application/repositories/FeedbackRepository';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import OutboxEventRepository from 'domain/application/repositories/OutboxEventRepository';
import TransactionCategoryRepository from 'domain/application/repositories/TransactionCategoryRepository';
import TransactionRepository from 'domain/application/repositories/TransactionRepository';

export interface UnitOfWorkRepositories {
  cultures: CultureRepository;
  farmers: FarmerRepository;
  farms: FarmRepository;
  feedbacks: FeedbackRepository;
  harvests: HarvestRepository;
  outboxEvents: OutboxEventRepository;
  transactionCategories: TransactionCategoryRepository;
  transactions: TransactionRepository;
}

export interface UnitOfWorkScope extends AsyncDisposable {
  readonly repositories: UnitOfWorkRepositories;
  commit(): Promise<void>;
}

export default abstract class UnitOfWork {
  abstract begin(): Promise<UnitOfWorkScope>;
}

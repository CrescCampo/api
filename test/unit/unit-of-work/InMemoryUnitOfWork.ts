import UnitOfWork, {
  UnitOfWorkRepositories,
  UnitOfWorkScope,
} from 'domain/application/unit-of-work/UnitOfWork';
import InMemoryCultureRepository from '../repositories/InMemoryCultureRepository';
import InMemoryFarmRepository from '../repositories/InMemoryFarmRepository';
import InMemoryFarmerRepository from '../repositories/InMemoryFarmerRepository';
import InMemoryFeedbackRepository from '../repositories/InMemoryFeedbackRepository';
import InMemoryHarvestRepository from '../repositories/InMemoryHarvestRepository';
import InMemoryOutboxEventRepository from '../repositories/InMemoryOutboxEventRepository';
import InMemoryTransactionCategoryRepository from '../repositories/InMemoryTransactionCategoryRepository';
import InMemoryTransactionRepository from '../repositories/InMemoryTransactionRepository';

export interface InMemoryUnitOfWorkRepositories extends UnitOfWorkRepositories {
  cultures: InMemoryCultureRepository;
  farmers: InMemoryFarmerRepository;
  farms: InMemoryFarmRepository;
  feedbacks: InMemoryFeedbackRepository;
  harvests: InMemoryHarvestRepository;
  outboxEvents: InMemoryOutboxEventRepository;
  transactionCategories: InMemoryTransactionCategoryRepository;
  transactions: InMemoryTransactionRepository;
}

type ScopeState = 'open' | 'committed' | 'rolledback';

interface ScopeCounters {
  commitCount: number;
  rollbackCount: number;
}

class InMemoryUnitOfWorkScope implements UnitOfWorkScope {
  private state: ScopeState = 'open';

  constructor(
    private readonly repos: InMemoryUnitOfWorkRepositories,
    private readonly counters: ScopeCounters,
  ) {}

  get repositories(): UnitOfWorkRepositories {
    if (this.state !== 'open') {
      throw new Error(
        `UnitOfWorkScope: cannot read repositories in state "${this.state}"`,
      );
    }
    return this.repos;
  }

  commit(): Promise<void> {
    if (this.state !== 'open') {
      return Promise.reject(
        new Error(`UnitOfWorkScope: cannot commit in state "${this.state}"`),
      );
    }
    this.state = 'committed';
    this.counters.commitCount += 1;
    return Promise.resolve();
  }

  [Symbol.asyncDispose](): Promise<void> {
    if (this.state !== 'open') {
      return Promise.resolve();
    }
    this.state = 'rolledback';
    this.counters.rollbackCount += 1;
    return Promise.resolve();
  }
}

export default class InMemoryUnitOfWork extends UnitOfWork {
  public commitCount = 0;

  public rollbackCount = 0;

  constructor(private readonly repos: InMemoryUnitOfWorkRepositories) {
    super();
  }

  begin(): Promise<UnitOfWorkScope> {
    return Promise.resolve(new InMemoryUnitOfWorkScope(this.repos, this));
  }
}

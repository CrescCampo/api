import { Injectable } from '@nestjs/common';
import UnitOfWork, {
  UnitOfWorkRepositories,
  UnitOfWorkScope,
} from 'domain/application/unit-of-work/UnitOfWork';
import DrizzleService from '../drizzle.service';
import DrizzleCultureRepository from '../repositories/culture.repository';
import DrizzleFarmRepository from '../repositories/farm.repository';
import DrizzleFarmerRepository from '../repositories/farmer.repository';
import DrizzleFeedbackRepository from '../repositories/feedback.repository';
import DrizzleHarvestRepository from '../repositories/harvest.repository';
import DrizzleOutboxEventRepository from '../repositories/outbox-event.repository';
import DrizzleTransactionCategoryRepository from '../repositories/transaction-category.repository';
import DrizzleTransactionRepository from '../repositories/transaction.repository';
import type { DrizzleConnection } from '../types';

class RollbackSignal extends Error {
  constructor() {
    super('UnitOfWork rollback');
    this.name = 'RollbackSignal';
  }
}

type ScopeState = 'pending' | 'open' | 'committed' | 'rolledback';

function buildRepositories(tx: DrizzleConnection): UnitOfWorkRepositories {
  return {
    cultures: new DrizzleCultureRepository(tx),
    farmers: new DrizzleFarmerRepository(tx),
    farms: new DrizzleFarmRepository(tx),
    feedbacks: new DrizzleFeedbackRepository(tx),
    harvests: new DrizzleHarvestRepository(tx),
    outboxEvents: new DrizzleOutboxEventRepository(tx),
    transactionCategories: new DrizzleTransactionCategoryRepository(tx),
    transactions: new DrizzleTransactionRepository(tx),
  };
}

class DrizzleUnitOfWorkScope implements UnitOfWorkScope {
  private state: ScopeState = 'pending';

  private repos?: UnitOfWorkRepositories;

  private resolveCommit?: () => void;

  private rejectCommit?: (err: Error) => void;

  private txPromise?: Promise<void>;

  constructor(private readonly drizzle: DrizzleService) {}

  async open(): Promise<void> {
    let signalReady!: () => void;
    let signalReadyError!: (err: unknown) => void;
    const ready = new Promise<void>((res, rej) => {
      signalReady = res;
      signalReadyError = rej;
    });

    this.txPromise = this.drizzle.connection
      .transaction(async tx => {
        this.repos = buildRepositories(tx);
        this.state = 'open';
        signalReady();

        await new Promise<void>((resolve, reject) => {
          this.resolveCommit = resolve;
          this.rejectCommit = reject;
        });
      })
      .catch(err => {
        if (this.state === 'pending') {
          signalReadyError(err);
        }
        throw err;
      });

    await ready;
  }

  get repositories(): UnitOfWorkRepositories {
    if (this.state !== 'open') {
      throw new Error(
        `UnitOfWorkScope: cannot read repositories in state "${this.state}"`,
      );
    }
    return this.repos as UnitOfWorkRepositories;
  }

  async commit(): Promise<void> {
    if (this.state !== 'open') {
      throw new Error(
        `UnitOfWorkScope: cannot commit in state "${this.state}"`,
      );
    }
    this.state = 'committed';
    (this.resolveCommit as () => void)();
    await this.txPromise;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (this.state !== 'open') {
      return;
    }
    this.state = 'rolledback';
    (this.rejectCommit as (err: Error) => void)(new RollbackSignal());
    try {
      await this.txPromise;
    } catch (err) {
      if (!(err instanceof RollbackSignal)) {
        throw err;
      }
    }
  }
}

@Injectable()
export default class DrizzleUnitOfWork extends UnitOfWork {
  constructor(private readonly drizzle: DrizzleService) {
    super();
  }

  async begin(): Promise<UnitOfWorkScope> {
    const scope = new DrizzleUnitOfWorkScope(this.drizzle);
    await scope.open();
    return scope;
  }
}

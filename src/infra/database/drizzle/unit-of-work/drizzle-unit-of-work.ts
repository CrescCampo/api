import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import type { AppDrizzleAdapter } from '../types';

@Injectable()
export default class DrizzleUnitOfWork extends UnitOfWork {
  constructor(private readonly txHost: TransactionHost<AppDrizzleAdapter>) {
    super();
  }

  run<T>(fn: () => Promise<T>): Promise<T> {
    return this.txHost.withTransaction(fn);
  }
}

import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';

export default class InMemoryUnitOfWork extends UnitOfWork {
  public commitCount = 0;

  public rollbackCount = 0;

  async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.commitCount += 1;
      return result;
    } catch (err) {
      this.rollbackCount += 1;
      throw err;
    }
  }
}

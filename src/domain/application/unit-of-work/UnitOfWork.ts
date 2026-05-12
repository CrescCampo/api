export default abstract class UnitOfWork {
  abstract run<T>(fn: () => Promise<T>): Promise<T>;
}

import OutboxEventRepository, {
  OutboxEventRecord,
} from 'domain/application/repositories/OutboxEventRepository';

export default class InMemoryOutboxEventRepository implements OutboxEventRepository {
  items: OutboxEventRecord[] = [];

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.items.some(item => item.id === id));
  }

  save(event: OutboxEventRecord): Promise<void> {
    this.items.push(event);
    return Promise.resolve();
  }
}

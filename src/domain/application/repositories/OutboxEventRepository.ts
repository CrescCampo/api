export interface OutboxEventRecord {
  id: string;
  event: string;
  entity: string;
  createdAt: number;
}

export default abstract class OutboxEventRepository {
  abstract exists(id: string): Promise<boolean>;

  abstract save(event: OutboxEventRecord): Promise<void>;
}

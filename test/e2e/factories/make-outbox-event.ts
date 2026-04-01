import { randomUUID } from 'crypto';

export default function makeOutboxEvent(
  entity: string,
  payload: Record<string, unknown>,
  id?: string,
) {
  return {
    id: id ?? randomUUID(),
    event: 'create',
    entity,
    payload: JSON.stringify(payload),
    createdAt: Date.now(),
  };
}

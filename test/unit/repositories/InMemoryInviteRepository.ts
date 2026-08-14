import InviteRepository from 'domain/application/repositories/InviteRepository';
import Invite from 'domain/enterprise/entities/Invite';

export default class InMemoryInviteRepository implements InviteRepository {
  items: Invite[] = [];

  async save(invite: Invite) {
    const existingIndex = this.items.findIndex(item => item.id === invite.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = invite;
      return Promise.resolve();
    }

    this.items.push(invite);
    return Promise.resolve();
  }

  async findByCode(code: string) {
    const normalized = Invite.normalizeCode(code);
    const invite = this.items.find(item => item.code === normalized);

    return Promise.resolve(invite ?? null);
  }

  async findByCodeForUpdate(code: string) {
    return this.findByCode(code);
  }

  async list() {
    return Promise.resolve(
      [...this.items].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    );
  }
}

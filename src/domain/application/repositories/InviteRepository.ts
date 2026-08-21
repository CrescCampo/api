import Invite from 'domain/enterprise/entities/Invite';

export default abstract class InviteRepository {
  abstract save(invite: Invite): Promise<void>;

  abstract findByCode(code: string): Promise<Invite | null>;

  abstract findByCodeForUpdate(code: string): Promise<Invite | null>;

  abstract list(): Promise<Invite[]>;

  abstract listPaginated(limit: number, offset: number): Promise<Invite[]>;

  abstract count(): Promise<number>;
}

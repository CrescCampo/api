import { Injectable } from '@nestjs/common';
import InviteNotFoundError from 'domain/application/errors/invite/InviteNotFoundError';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Invite from 'domain/enterprise/entities/Invite';

export interface Input {
  code: string;
}

export interface Output {
  code: string;
  revokedAt: Date;
}

@Injectable()
export default class RevokeInvite {
  constructor(
    private readonly inviteRepository: InviteRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Output> {
    const code = Invite.normalizeCode(input.code);

    return this.unitOfWork.run(async () => {
      const invite = await this.inviteRepository.findByCodeForUpdate(code);

      if (!invite) {
        throw new InviteNotFoundError(code);
      }

      const alreadyRevoked = invite.revokedAt;

      if (alreadyRevoked) {
        return { code: invite.code, revokedAt: alreadyRevoked };
      }

      const revokedAt = invite.revoke();

      await this.inviteRepository.save(invite);

      return { code: invite.code, revokedAt };
    });
  }
}

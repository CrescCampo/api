import { Injectable } from '@nestjs/common';
import InvalidInviteError from 'domain/application/errors/auth/InvalidInviteError';
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
        throw new InvalidInviteError();
      }

      invite.revoke();

      await this.inviteRepository.save(invite);

      return { code: invite.code, revokedAt: invite.revokedAt as Date };
    });
  }
}

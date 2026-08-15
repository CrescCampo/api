import { Injectable } from '@nestjs/common';
import InvalidInviteSettingsError from 'domain/application/errors/invite/InvalidInviteSettingsError';
import InviteCodeGenerationError from 'domain/application/errors/invite/InviteCodeGenerationError';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Invite from 'domain/enterprise/entities/Invite';

const MAX_CODE_ATTEMPTS = 10;

export interface Input {
  maxUses?: number;
  expiresAt?: Date | null;
  note?: string | null;
}

export interface Output {
  id: string;
  code: string;
}

@Injectable()
export default class CreateInvite {
  constructor(
    private readonly inviteRepository: InviteRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: Input): Promise<Output> {
    const maxUses = input.maxUses ?? 1;

    if (!Number.isInteger(maxUses) || maxUses < 1) {
      throw new InvalidInviteSettingsError(
        'maxUses must be an integer greater than or equal to 1',
      );
    }

    const expiresAt = input.expiresAt ?? null;

    if (expiresAt !== null && expiresAt.getTime() <= Date.now()) {
      throw new InvalidInviteSettingsError('expiresAt must be in the future');
    }

    const code = await this.generateAvailableCode(MAX_CODE_ATTEMPTS);

    const invite = Invite.create({
      code,
      maxUses,
      expiresAt,
      note: input.note ?? null,
    });

    await this.unitOfWork.run(async () => {
      await this.inviteRepository.save(invite);
    });

    return { id: invite.id, code: invite.code };
  }

  private async generateAvailableCode(attemptsLeft: number): Promise<string> {
    const code = Invite.generateCode();
    const existing = await this.inviteRepository.findByCode(code);

    if (!existing) {
      return code;
    }

    if (attemptsLeft <= 1) {
      throw new InviteCodeGenerationError(MAX_CODE_ATTEMPTS);
    }

    return this.generateAvailableCode(attemptsLeft - 1);
  }
}

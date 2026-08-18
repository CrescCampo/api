import { Injectable } from '@nestjs/common';
import InvalidInviteSettingsError from 'domain/application/errors/invite/InvalidInviteSettingsError';
import InviteCodeAlreadyExistsError from 'domain/application/errors/invite/InviteCodeAlreadyExistsError';
import InviteCodeGenerationError from 'domain/application/errors/invite/InviteCodeGenerationError';
import InviteRepository from 'domain/application/repositories/InviteRepository';
import UnitOfWork from 'domain/application/unit-of-work/UnitOfWork';
import Invite from 'domain/enterprise/entities/Invite';

const MAX_CODE_ATTEMPTS = 10;

export const MAX_USES_LIMIT = 10_000;

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

    if (maxUses > MAX_USES_LIMIT) {
      throw new InvalidInviteSettingsError(
        `maxUses must be at most ${MAX_USES_LIMIT}`,
      );
    }

    const expiresAt = input.expiresAt ?? null;

    if (expiresAt !== null && Number.isNaN(expiresAt.getTime())) {
      throw new InvalidInviteSettingsError('expiresAt is not a valid date');
    }

    if (expiresAt !== null && expiresAt.getTime() <= Date.now()) {
      throw new InvalidInviteSettingsError('expiresAt must be in the future');
    }

    return this.saveWithUniqueCode(
      { maxUses, expiresAt, note: input.note ?? null },
      MAX_CODE_ATTEMPTS,
    );
  }

  private async saveWithUniqueCode(
    props: { maxUses: number; expiresAt: Date | null; note: string | null },
    attemptsLeft: number,
  ): Promise<Output> {
    const invite = Invite.create({ ...props, code: Invite.generateCode() });

    try {
      await this.unitOfWork.run(async () => {
        await this.inviteRepository.save(invite);
      });
    } catch (error) {
      if (!(error instanceof InviteCodeAlreadyExistsError)) {
        throw error;
      }

      if (attemptsLeft <= 1) {
        throw new InviteCodeGenerationError(MAX_CODE_ATTEMPTS);
      }

      return this.saveWithUniqueCode(props, attemptsLeft - 1);
    }

    return { id: invite.id, code: invite.code };
  }
}

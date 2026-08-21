import { UseCaseError } from 'core/use-case-error';

export default class InviteCodeAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor(code: string) {
    super(`Invite code ${code} already exists`);
    this.name = 'InviteCodeAlreadyExistsError';
  }
}

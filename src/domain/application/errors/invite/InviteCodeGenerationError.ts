import { UseCaseError } from 'core/use-case-error';

export default class InviteCodeGenerationError
  extends Error
  implements UseCaseError
{
  constructor(attempts: number) {
    super(`Could not generate a unique invite code after ${attempts} attempts`);
    this.name = 'InviteCodeGenerationError';
  }
}

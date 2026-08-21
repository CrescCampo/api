import { UseCaseError } from 'core/use-case-error';

export default class InvalidInviteSettingsError
  extends Error
  implements UseCaseError
{
  constructor(reason: string) {
    super(`Invalid invite settings: ${reason}`);
    this.name = 'InvalidInviteSettingsError';
  }
}

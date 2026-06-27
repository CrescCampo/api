import { UseCaseError } from 'core/use-case-error';

export default class OAuthNotConfiguredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('OAuth provider not configured');
    this.name = 'OAuthNotConfiguredError';
  }
}

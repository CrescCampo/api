import { UseCaseError } from 'core/use-case-error';

export default class EmailNotVerifiedByProviderError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Email not verified by provider');
    this.name = 'EmailNotVerifiedByProviderError';
  }
}

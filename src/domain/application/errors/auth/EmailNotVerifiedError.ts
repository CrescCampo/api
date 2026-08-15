import { UseCaseError } from 'core/use-case-error';

export default class EmailNotVerifiedError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Email not verified');
    this.name = 'EmailNotVerifiedError';
  }
}

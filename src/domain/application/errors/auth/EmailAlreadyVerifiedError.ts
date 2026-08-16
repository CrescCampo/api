import { UseCaseError } from 'core/use-case-error';

export default class EmailAlreadyVerifiedError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Email already verified');
    this.name = 'EmailAlreadyVerifiedError';
  }
}

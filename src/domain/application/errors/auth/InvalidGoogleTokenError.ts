import { UseCaseError } from 'core/use-case-error';

export default class InvalidGoogleTokenError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Invalid Google token');
    this.name = 'InvalidGoogleTokenError';
  }
}

import { UseCaseError } from 'core/use-case-error';

export default class WrongCredentialsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Wrong Credentials');
    this.name = 'WrongCredentialsError';
  }
}

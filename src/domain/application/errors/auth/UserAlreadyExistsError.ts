import { UseCaseError } from 'core/use-case-error';

export default class UserAlreadyExistsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('User already exists');
    this.name = 'UserAlreadyExistsError';
  }
}

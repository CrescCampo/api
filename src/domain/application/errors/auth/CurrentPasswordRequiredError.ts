import { UseCaseError } from 'core/use-case-error';

export default class CurrentPasswordRequiredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Current password is required');
    this.name = 'CurrentPasswordRequiredError';
  }
}

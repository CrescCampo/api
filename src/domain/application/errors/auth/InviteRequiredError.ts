import { UseCaseError } from 'core/use-case-error';

export default class InviteRequiredError extends Error implements UseCaseError {
  constructor() {
    super('An invite code is required to create an account');
    this.name = 'InviteRequiredError';
  }
}

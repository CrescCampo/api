import { UseCaseError } from 'core/use-case-error';

export default class InvalidInviteError extends Error implements UseCaseError {
  constructor() {
    super('Invalid invite code');
    this.name = 'InvalidInviteError';
  }
}

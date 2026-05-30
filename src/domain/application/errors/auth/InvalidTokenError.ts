import { UseCaseError } from 'core/use-case-error';

export default class InvalidTokenError extends Error implements UseCaseError {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidTokenError';
  }
}

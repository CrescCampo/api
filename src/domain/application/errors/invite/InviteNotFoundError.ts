import { UseCaseError } from 'core/use-case-error';

export default class InviteNotFoundError extends Error implements UseCaseError {
  constructor(code: string) {
    super(`Invite ${code} not found`);
    this.name = 'InviteNotFoundError';
  }
}

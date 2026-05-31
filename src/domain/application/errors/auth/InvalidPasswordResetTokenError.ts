import { UseCaseError } from 'core/use-case-error';

export default class InvalidPasswordResetTokenError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Invalid or expired password reset token');
    this.name = 'InvalidPasswordResetTokenError';
  }
}

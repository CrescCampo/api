import { UseCaseError } from 'core/use-case-error';

export default class InvalidVerificationCodeError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Invalid or expired verification code');
    this.name = 'InvalidVerificationCodeError';
  }
}

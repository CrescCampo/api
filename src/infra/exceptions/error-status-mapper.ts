import { HttpStatus } from '@nestjs/common';
import { UseCaseError } from 'core/use-case-error';
import InvalidPasswordResetTokenError from 'domain/application/errors/auth/InvalidPasswordResetTokenError';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import InvalidGoogleTokenError from 'domain/application/errors/auth/InvalidGoogleTokenError';
import EmailNotVerifiedByProviderError from 'domain/application/errors/auth/EmailNotVerifiedByProviderError';
import EmailNotVerifiedError from 'domain/application/errors/auth/EmailNotVerifiedError';
import InvalidVerificationCodeError from 'domain/application/errors/auth/InvalidVerificationCodeError';
import EmailAlreadyVerifiedError from 'domain/application/errors/auth/EmailAlreadyVerifiedError';
import OAuthNotConfiguredError from 'domain/application/errors/auth/OAuthNotConfiguredError';
import CurrentPasswordRequiredError from 'domain/application/errors/auth/CurrentPasswordRequiredError';
import InviteRequiredError from 'domain/application/errors/auth/InviteRequiredError';
import InvalidInviteError from 'domain/application/errors/auth/InvalidInviteError';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';
import HarvestNotFoundError from 'domain/application/errors/harvest/HarvestNotFoundError';

export default class ErrorStatusMapper {
  private static readonly errorStatusMap = new Map<string, HttpStatus>([
    // 401 - Unauthorized (Authentication failed)
    [WrongCredentialsError.name, HttpStatus.UNAUTHORIZED],
    [InvalidGoogleTokenError.name, HttpStatus.UNAUTHORIZED],

    // 400 - Bad Request (Invalid input / token)
    [InvalidPasswordResetTokenError.name, HttpStatus.BAD_REQUEST],
    [EmailNotVerifiedByProviderError.name, HttpStatus.BAD_REQUEST],
    [CurrentPasswordRequiredError.name, HttpStatus.BAD_REQUEST],
    [InvalidVerificationCodeError.name, HttpStatus.BAD_REQUEST],

    [EmailNotVerifiedError.name, HttpStatus.FORBIDDEN],

    // 403 - Forbidden (Access not granted)
    [InviteRequiredError.name, HttpStatus.FORBIDDEN],
    [InvalidInviteError.name, HttpStatus.FORBIDDEN],

    // 409 - Conflict (Resource already exists)
    [UserAlreadyExistsError.name, HttpStatus.CONFLICT],
    [EmailAlreadyVerifiedError.name, HttpStatus.CONFLICT],

    // 503 - Service Unavailable (Provider not configured)
    [OAuthNotConfiguredError.name, HttpStatus.SERVICE_UNAVAILABLE],

    // 404 - Not Found
    [FarmerNotFoundError.name, HttpStatus.NOT_FOUND],
    [TransactionNotFoundError.name, HttpStatus.NOT_FOUND],
    [HarvestNotFoundError.name, HttpStatus.NOT_FOUND],
  ]);

  static getStatusCode(error: Error): HttpStatus {
    if (this.isDomainError(error)) {
      const statusCode = this.errorStatusMap.get(error.constructor.name);
      if (statusCode) {
        return statusCode;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private static isDomainError(error: Error): error is Error & UseCaseError {
    return (
      error instanceof Error &&
      'message' in error &&
      error.name.endsWith('Error')
    );
  }

  static getErrorName(error: Error): string {
    if (this.isDomainError(error)) {
      return error.constructor.name
        .replace(/Error$/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    }

    return (error as Error).constructor.name || 'Unknown Error';
  }

  static isCriticalError(error: Error): boolean {
    return !this.isDomainError(error);
  }
}

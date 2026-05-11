import { HttpStatus } from '@nestjs/common';
import { UseCaseError } from 'core/use-case-error';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';
import TransactionNotFoundError from 'domain/application/errors/transaction/TransactionNotFoundError';
import HarvestNotFoundError from 'domain/application/errors/harvest/HarvestNotFoundError';

export default class ErrorStatusMapper {
  private static readonly errorStatusMap = new Map<string, HttpStatus>([
    // 401 - Unauthorized (Authentication failed)
    [WrongCredentialsError.name, HttpStatus.UNAUTHORIZED],

    // 409 - Conflict (Resource already exists)
    [UserAlreadyExistsError.name, HttpStatus.CONFLICT],

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

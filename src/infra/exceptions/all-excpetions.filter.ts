import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

import ErrorStatusMapper from './error-status-mapper';

const SAFE_HEADERS = [
  'host',
  'user-agent',
  'content-type',
  'content-length',
  'accept',
];
const SENSITIVE_BODY_FIELDS = ['password', 'token', 'refreshToken', 'apiKey'];

function pickSafeHeaders(h: Request['headers']) {
  return Object.fromEntries(
    Object.entries(h ?? {}).filter(([k]) =>
      SAFE_HEADERS.includes(k.toLowerCase()),
    ),
  );
}

function redactBody(b: unknown) {
  if (!b || typeof b !== 'object') return b;
  return Object.fromEntries(
    Object.entries(b as Record<string, unknown>).map(([k, v]) =>
      SENSITIVE_BODY_FIELDS.includes(k) ? [k, '[redacted]'] : [k, v],
    ),
  );
}

@Catch()
export default class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = this.getHttpException(exception);

    const errorResponse = this.getErrorResponse(error, request);
    const errorLog = this.getErrorLog(errorResponse, request, exception);

    const logMessage = JSON.stringify(errorLog);
    const context = 'All Exception Filter';
    if (ErrorStatusMapper.isCriticalError(exception)) {
      Logger.error(logMessage, exception.stack, context);
    } else {
      Logger.warn(logMessage, context);
    }

    response.status(error.statusCode).json(error);
  }

  private getHttpException(exception: Error) {
    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse() as any;
      return {
        statusCode: exception.getStatus(),
        error: errorResponse.error ? errorResponse.error : exception.name,
        message: errorResponse.message
          ? errorResponse.message
          : exception.message,
      };
    }

    const statusCode = ErrorStatusMapper.getStatusCode(exception);
    const errorName = ErrorStatusMapper.getErrorName(exception);

    return {
      statusCode,
      error: errorName,
      message: exception.message || 'An error occurred',
    };
  }

  private getErrorResponse = (
    error: { statusCode: number; error: string; message: string },
    request: Request,
  ) => ({
    statusCode: error.statusCode,
    error: error.error,
    message: error.message,
    path: request.url,
    method: request.method,
    timeStamp: new Date(),
  });

  private getErrorLog = (
    errorResponse: { statusCode: number; error: string; timeStamp: Date },
    request: Request,
    exception: Error,
  ) => ({
    path: request.url,
    method: request.method,
    headers: pickSafeHeaders(request.headers),
    body: redactBody(request.body),
    error: { message: exception.message, stack: exception.stack },
  });
}

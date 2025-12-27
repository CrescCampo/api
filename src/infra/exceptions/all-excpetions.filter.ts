import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

import ErrorStatusMapper from './error-status-mapper';

@Catch()
export default class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = this.getHttpException(exception);

    const errorResponse = this.getErrorResponse(error, request);
    const errorLog = this.getErrorLog(errorResponse, request, exception);

    // Log critical errors with ERROR level, domain errors with WARN level
    const logLevel = ErrorStatusMapper.isCriticalError(exception)
      ? 'error'
      : 'warn';
    Logger[logLevel](errorLog, 'All Exception Filter');

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

  private getErrorResponse = (error: any, request: Request) => ({
    statusCode: error.statusCode,
    error: error.error,
    message: error.message,
    path: request.url,
    method: request.method,
    timeStamp: new Date(),
  });

  private getErrorLog = (
    errorResponse: any,
    request: Request,
    exception: Error,
  ): string => {
    const { statusCode, error, timeStamp } = errorResponse;
    const { method, url } = request;
    const errorLog = `Time: ${timeStamp}
    Response Code: ${statusCode} - Method: ${method} - URL: ${url}\n
    From IP: ${request.ip ?? 'none'}
    Req Headers: ${JSON.stringify(request.headers ?? 'empty headers')}
    Req Body: ${JSON.stringify(request.body ?? 'empty body')}
    Req Query: ${JSON.stringify(request.query ?? 'empty query')}
    Req Params: ${JSON.stringify(request.params ?? 'empty params')}\n
    ${exception.stack ? exception.stack : error}`;
    return errorLog;
  };
}

import {
  Injectable,
  Inject,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'winston';
import { Observable, tap } from 'rxjs';
import Environment from 'infra/config/Environment';
import config from 'infra/config';

@Injectable()
export default class LoggerInterceptor implements NestInterceptor {
  constructor(@Inject('winston') private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (config.app.environment === Environment.DEV) {
      const now = Date.now();
      return next.handle().pipe(
        tap(data => {
          const delay = Date.now() - now;
          this.logResponse(context.switchToHttp().getResponse(), data, delay);
        }),
      );
    }
    return next.handle();
  }

  private getDataType(data: any) {
    const type = typeof data;
    if (type === 'object') {
      if (Array.isArray(data)) return 'array';
    }
    return type;
  }

  private logResponse(res: Response, data: any, delay: Number) {
    const { statusCode } = res;
    const dataType = this.getDataType(data);
    this.logger.info({
      type: 'RESPONSE',
      statusCode,
      dataType,
      data: dataType === 'array' ? `Array size: ${data.length}` : data,
      delay: `${delay}ms`,
    });
  }
}

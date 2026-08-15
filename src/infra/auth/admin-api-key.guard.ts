import { createHash, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import config from 'infra/config';

export const ADMIN_API_KEY_HEADER = 'x-admin-key';

export const ADMIN_API_KEY_SECURITY_SCHEME = 'admin-api-key';

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

@Injectable()
export default class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[ADMIN_API_KEY_HEADER];

    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('Missing or invalid admin API key');
    }

    if (!timingSafeEqual(digest(provided), digest(config.admin.apiKey))) {
      throw new UnauthorizedException('Missing or invalid admin API key');
    }

    return true;
  }
}

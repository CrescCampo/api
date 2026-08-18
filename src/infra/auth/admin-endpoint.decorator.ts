import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import AdminApiKeyGuard, {
  ADMIN_API_KEY_SECURITY_SCHEME,
} from './admin-api-key.guard';

export default function AdminEndpoint(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    UseGuards(AdminApiKeyGuard),
    ApiSecurity(ADMIN_API_KEY_SECURITY_SCHEME),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

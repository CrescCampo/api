import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export default class EmailIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const ip = req.ip as string;
    const email = (req.body as Record<string, string>)?.email ?? '';
    return `${ip}:${email}`;
  }
}

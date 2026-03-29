import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { eq, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import DrizzleService from 'infra/database/drizzle/drizzle.service';
import { waIncomingMessages } from 'infra/database/drizzle/external-schemas';
import WaConversationService from './wa-conversation.service';

const POLL_INTERVAL_MS = 5_000;

@Injectable()
export default class WaQueueService {
  private readonly logger = new Logger(WaQueueService.name);

  private readonly db: NodePgDatabase<Record<string, never>>;

  private processing = false;

  constructor(
    drizzleService: DrizzleService,
    private readonly conversationService: WaConversationService,
  ) {
    this.db = drizzleService.connection;
  }

  @Interval(POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const pending = await this.db
        .select()
        .from(waIncomingMessages)
        .where(eq(waIncomingMessages.status, 'pending'))
        .orderBy(asc(waIncomingMessages.createdAt))
        .limit(10);

      for (const msg of pending) {
        await this.db
          .update(waIncomingMessages)
          .set({ status: 'processing' })
          .where(eq(waIncomingMessages.id, msg.id));

        try {
          await this.conversationService.handle(msg.phoneNumber, msg.content);

          await this.db
            .update(waIncomingMessages)
            .set({ status: 'processed', processedAt: new Date() })
            .where(eq(waIncomingMessages.id, msg.id));

          this.logger.log(
            `Processed message ${msg.id} from ${msg.phoneNumber}`,
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);

          await this.db
            .update(waIncomingMessages)
            .set({ status: 'failed', error: errorMessage })
            .where(eq(waIncomingMessages.id, msg.id));

          this.logger.error(
            `Failed to process message ${msg.id}: ${errorMessage}`,
          );
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

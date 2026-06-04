import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { eq, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import DrizzleService from 'infra/database/drizzle/drizzle.service';
import AudioQueueModel from 'infra/database/drizzle/models/AudioQueue';
import {
  waIncomingMessages,
  messages as messagesTable,
} from 'infra/database/drizzle/external-schemas';
import S3Service from 'infra/storage/s3.service';
import WaLlmService from './wa-llm.service';

const POLL_INTERVAL_MS = 5_000;

const FAILURE_REPLY =
  'Não consegui entender seu áudio 😕 Pode tentar gravar de novo ou me escrever?';

@Injectable()
export default class WaAudioQueueService {
  private readonly logger = new Logger(WaAudioQueueService.name);

  private readonly db: NodePgDatabase<Record<string, never>>;

  private processing = false;

  constructor(
    drizzleService: DrizzleService,
    private readonly s3Service: S3Service,
    private readonly llmService: WaLlmService,
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
        .from(AudioQueueModel)
        .where(eq(AudioQueueModel.status, 'PENDING'))
        .orderBy(asc(AudioQueueModel.createdAt))
        .limit(10);

      for (const audio of pending) {
        try {
          const buffer = await this.s3Service.download(audio.s3Url);
          const transcription = await this.llmService.transcribe(buffer);

          await this.db.insert(waIncomingMessages).values({
            phoneNumber: audio.phoneNumber,
            jid: audio.jid,
            content: transcription,
          });

          await this.db
            .update(AudioQueueModel)
            .set({ status: 'PROCESSED', processedAt: new Date() })
            .where(eq(AudioQueueModel.id, audio.id));

          this.logger.log(
            `Transcribed audio ${audio.id} from ${audio.phoneNumber}`,
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);

          await this.db
            .update(AudioQueueModel)
            .set({
              status: 'FAILED',
              error: errorMessage,
              failReason: 'transcription_failed',
              processedAt: new Date(),
            })
            .where(eq(AudioQueueModel.id, audio.id));

          await this.db.insert(messagesTable).values({
            phoneNumber: audio.phoneNumber,
            jid: audio.jid,
            text: FAILURE_REPLY,
          });

          this.logger.error(
            `Failed to transcribe audio ${audio.id}: ${errorMessage}`,
          );
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

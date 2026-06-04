import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import AppModule from 'infra/app.module';
import DrizzleService from 'infra/database/drizzle/drizzle.service';
import AudioQueueModel from 'infra/database/drizzle/models/AudioQueue';
import {
  waIncomingMessages,
  messages as messagesTable,
} from 'infra/database/drizzle/external-schemas';
import S3Service from 'infra/storage/s3.service';
import WaAudioQueueService from 'infra/whatsapp-processor/wa-audio-queue.service';
import WaLlmService from 'infra/whatsapp-processor/wa-llm.service';

describe('Audio Queue Processor (e2e)', () => {
  let app: INestApplication;
  let db: NodePgDatabase<Record<string, never>>;
  let poller: WaAudioQueueService;

  const fakeS3 = { download: vi.fn() };
  const fakeLlm = { transcribe: vi.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue(fakeS3)
      .overrideProvider(WaLlmService)
      .useValue(fakeLlm)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const registry = app.get(SchedulerRegistry);
    registry.getIntervals().forEach(name => registry.deleteInterval(name));

    db = app.get(DrizzleService).connection;
    poller = app.get(WaAudioQueueService);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wa_incoming_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number varchar(20) NOT NULL,
        jid varchar(100),
        content text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        error text,
        created_at timestamp DEFAULT now(),
        processed_at timestamp
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number varchar(20) NOT NULL,
        jid varchar(100),
        text text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        retry_count integer DEFAULT 0,
        error text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        sent_at timestamp
      )
    `);
  });

  afterAll(async () => {
    await db.execute(sql`DROP TABLE IF EXISTS wa_incoming_messages`);
    await db.execute(sql`DROP TABLE IF EXISTS messages`);
    await app.close();
  });

  beforeEach(async () => {
    fakeS3.download.mockReset();
    fakeLlm.transcribe.mockReset();
    await db.execute(
      sql`TRUNCATE TABLE audio_queue, wa_incoming_messages, messages RESTART IDENTITY CASCADE`,
    );
  });

  it('should transcribe a pending audio and enqueue it as an incoming text message', async () => {
    fakeS3.download.mockResolvedValue(Buffer.from('fake-audio'));
    fakeLlm.transcribe.mockResolvedValue(
      'quero registrar uma despesa de adubo',
    );

    const id = randomUUID();
    await db.insert(AudioQueueModel).values({
      id,
      createdAt: new Date(),
      phoneNumber: '5511988887777',
      jid: '5511988887777@s.whatsapp.net',
      status: 'PENDING',
      s3Url: 'whatsapp-audios/test-success.ogg',
    });

    await poller.poll();

    expect(fakeS3.download).toHaveBeenCalledWith(
      'whatsapp-audios/test-success.ogg',
    );

    const [audio] = await db
      .select()
      .from(AudioQueueModel)
      .where(eq(AudioQueueModel.id, id));

    expect(audio.status).toBe('PROCESSED');
    expect(audio.processedAt).not.toBeNull();

    const incoming = await db.select().from(waIncomingMessages);
    expect(incoming).toHaveLength(1);
    expect(incoming[0].content).toBe('quero registrar uma despesa de adubo');
    expect(incoming[0].phoneNumber).toBe('5511988887777');

    const outgoing = await db.select().from(messagesTable);
    expect(outgoing).toHaveLength(0);
  });

  it('should mark the audio as failed and notify the farmer when transcription fails', async () => {
    fakeS3.download.mockRejectedValue(new Error('s3 unavailable'));

    const id = randomUUID();
    await db.insert(AudioQueueModel).values({
      id,
      createdAt: new Date(),
      phoneNumber: '5511955554444',
      jid: '5511955554444@s.whatsapp.net',
      status: 'PENDING',
      s3Url: 'whatsapp-audios/test-failure.ogg',
    });

    await poller.poll();

    const [audio] = await db
      .select()
      .from(AudioQueueModel)
      .where(eq(AudioQueueModel.id, id));

    expect(audio.status).toBe('FAILED');
    expect(audio.error).toContain('s3 unavailable');
    expect(audio.failReason).toBe('transcription_failed');

    const incoming = await db.select().from(waIncomingMessages);
    expect(incoming).toHaveLength(0);

    const outgoing = await db.select().from(messagesTable);
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0].phoneNumber).toBe('5511955554444');
    expect(outgoing[0].text.length).toBeGreaterThan(0);
  });
});

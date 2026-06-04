import WaAudioQueueService from 'infra/whatsapp-processor/wa-audio-queue.service';
import AudioQueueModel from 'infra/database/drizzle/models/AudioQueue';
import {
  waIncomingMessages,
  messages as messagesTable,
} from 'infra/database/drizzle/external-schemas';
import type DrizzleService from 'infra/database/drizzle/drizzle.service';
import type S3Service from 'infra/storage/s3.service';
import type WaLlmService from 'infra/whatsapp-processor/wa-llm.service';

interface AudioRow {
  id: string;
  phoneNumber: string;
  jid: string | null;
  s3Url: string;
  status: string;
  createdAt: Date;
}

interface InsertCall {
  table: unknown;
  values: Record<string, unknown>;
}

interface UpdateCall {
  table: unknown;
  set: Record<string, unknown>;
}

function makeDb(pendingRows: AudioRow[]) {
  const inserts: InsertCall[] = [];
  const updates: UpdateCall[] = [];

  const connection = {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(pendingRows),
          }),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        inserts.push({ table, values });
        return Promise.resolve();
      },
    }),
    update: (table: unknown) => ({
      set: (set: Record<string, unknown>) => ({
        where: () => {
          updates.push({ table, set });
          return Promise.resolve();
        },
      }),
    }),
  };

  return { connection, inserts, updates };
}

function makeAudio(overrides: Partial<AudioRow> = {}): AudioRow {
  return {
    id: 'audio-1',
    phoneNumber: '5511999999999',
    jid: '5511999999999@s.whatsapp.net',
    s3Url: 'whatsapp-audios/audio-1.ogg',
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('WaAudioQueueService', () => {
  it('should transcribe a pending audio and enqueue it as a text message', async () => {
    const audio = makeAudio();
    const { connection, inserts, updates } = makeDb([audio]);

    const buffer = Buffer.from('fake-audio');
    const s3Service = { download: vi.fn().mockResolvedValue(buffer) };
    const llmService = {
      transcribe: vi.fn().mockResolvedValue('quero registrar uma despesa'),
    };

    const sut = new WaAudioQueueService(
      { connection } as unknown as DrizzleService,
      s3Service as unknown as S3Service,
      llmService as unknown as WaLlmService,
    );

    await sut.poll();

    expect(s3Service.download).toHaveBeenCalledWith(audio.s3Url);
    expect(llmService.transcribe).toHaveBeenCalledWith(buffer);

    const enqueued = inserts.find(i => i.table === waIncomingMessages);
    expect(enqueued).toBeDefined();
    expect(enqueued?.values).toMatchObject({
      phoneNumber: audio.phoneNumber,
      jid: audio.jid,
      content: 'quero registrar uma despesa',
    });

    const processed = updates.find(u => u.table === AudioQueueModel);
    expect(processed?.set.status).toBe('PROCESSED');
    expect(processed?.set.processedAt).toBeInstanceOf(Date);

    expect(inserts.find(i => i.table === messagesTable)).toBeUndefined();
  });

  it('should mark the audio as failed and notify the farmer when transcription fails', async () => {
    const audio = makeAudio({ id: 'audio-2' });
    const { connection, inserts, updates } = makeDb([audio]);

    const s3Service = {
      download: vi.fn().mockRejectedValue(new Error('s3 down')),
    };
    const llmService = { transcribe: vi.fn() };

    const sut = new WaAudioQueueService(
      { connection } as unknown as DrizzleService,
      s3Service as unknown as S3Service,
      llmService as unknown as WaLlmService,
    );

    await sut.poll();

    expect(llmService.transcribe).not.toHaveBeenCalled();
    expect(inserts.find(i => i.table === waIncomingMessages)).toBeUndefined();

    const failed = updates.find(u => u.table === AudioQueueModel);
    expect(failed?.set.status).toBe('FAILED');
    expect(failed?.set.error).toBe('s3 down');
    expect(failed?.set.failReason).toBe('transcription_failed');

    const notice = inserts.find(i => i.table === messagesTable);
    expect(notice).toBeDefined();
    expect(notice?.values.phoneNumber).toBe(audio.phoneNumber);
    expect(typeof notice?.values.text).toBe('string');
  });

  it('should do nothing when there are no pending audios', async () => {
    const { connection, inserts, updates } = makeDb([]);

    const s3Service = { download: vi.fn() };
    const llmService = { transcribe: vi.fn() };

    const sut = new WaAudioQueueService(
      { connection } as unknown as DrizzleService,
      s3Service as unknown as S3Service,
      llmService as unknown as WaLlmService,
    );

    await sut.poll();

    expect(s3Service.download).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});

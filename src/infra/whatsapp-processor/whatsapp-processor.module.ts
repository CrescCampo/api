import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import DatabaseModule from 'infra/database/database.module';
import StorageModule from 'infra/storage/storage.module';
import WaQueueService from './wa-queue.service';
import WaAudioQueueService from './wa-audio-queue.service';
import WaConversationService from './wa-conversation.service';
import WaLlmService from './wa-llm.service';
import WaToolExecutorService from './wa-tool-executor.service';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, StorageModule],
  providers: [
    WaQueueService,
    WaAudioQueueService,
    WaConversationService,
    WaLlmService,
    WaToolExecutorService,
  ],
})
export default class WhatsappProcessorModule {}

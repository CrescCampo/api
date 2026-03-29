import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import DatabaseModule from 'infra/database/database.module';
import WaQueueService from './wa-queue.service';
import WaConversationService from './wa-conversation.service';
import WaLlmService from './wa-llm.service';
import WaToolExecutorService from './wa-tool-executor.service';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [
    WaQueueService,
    WaConversationService,
    WaLlmService,
    WaToolExecutorService,
  ],
})
export default class WhatsappProcessorModule {}

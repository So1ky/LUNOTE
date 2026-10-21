import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { COMPLETION_QUEUE, CompletionProcessor } from './completion.processor';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';

@Module({
  imports: [
    NotificationsModule,
    // 완료 확인 기한 자동 완료 — 1시간 주기 스캔 (ARCHITECTURE §7 AWAITING_CONFIRMATION)
    BullModule.registerQueue({ name: COMPLETION_QUEUE }),
  ],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService, CompletionProcessor],
})
export class QuoteRequestsModule {}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import {
  AdminNotificationJob,
  NOTIFICATIONS_QUEUE,
} from './notifications.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async process(job: Job<AdminNotificationJob>): Promise<void> {
    const { requestId, category, userEmail } = job.data;
    const text = `🔔 새 문의 #${requestId}\n카테고리: ${category}\n사용자: ${userEmail}`;

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    if (token && chatId) {
      // 텔레그램 봇 발송 — 1인 운영자에게 가장 간단한 실시간 채널.
      // TODO: 관리자 앱 푸시(expo-notifications)는 Apple Developer 가입 후 추가
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        },
      );
      if (!res.ok) {
        // 실패를 던져야 BullMQ가 백오프 재시도한다
        throw new Error(`Telegram 발송 실패: HTTP ${res.status}`);
      }
      return;
    }

    // 채널 미설정 시 로그 폴백 (로컬 개발)
    this.logger.log(`[알림 폴백] ${text.replaceAll('\n', ' / ')}`);
  }
}

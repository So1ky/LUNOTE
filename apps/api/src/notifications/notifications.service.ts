import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export const NOTIFICATIONS_QUEUE = 'notifications';

/** 신규 문의 접수 → 모든 관리자에게 */
export type RequestCreatedJob = {
  type: 'REQUEST_CREATED';
  requestId: number;
  category: string;
  userEmail: string;
};

/** 견적 발송 → 문의 소유자에게 */
export type QuoteSentJob = {
  type: 'QUOTE_SENT';
  requestId: number;
  ownerId: string;
  amount: string;
  currency: string;
};

export type NotificationJob = RequestCreatedJob | QuoteSentJob;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<NotificationJob>,
  ) {}

  /**
   * 알림 잡을 큐에 넣는다. 발송(이메일)과 인앱 알림 생성은 워커가 처리한다.
   * 큐 등록 실패(Redis 다운 등)가 원래 요청을 실패시키지 않도록 삼킨다.
   */
  async enqueue(job: NotificationJob) {
    try {
      await this.queue.add(job.type, job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100, // 최근 100건만 보관
        removeOnFail: 500,
      });
    } catch (e) {
      this.logger.error(`알림 큐 등록 실패: ${(e as Error).message}`);
    }
  }
}

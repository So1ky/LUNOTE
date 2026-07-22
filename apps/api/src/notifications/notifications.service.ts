import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export const NOTIFICATIONS_QUEUE = 'notifications';

export type AdminNotificationJob = {
  type: 'REQUEST_CREATED';
  requestId: number;
  category: string;
  userEmail: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<AdminNotificationJob>,
  ) {}

  /**
   * 관리자 알림을 큐에 넣는다. 발송 실패는 워커가 재시도한다.
   * 큐 등록 실패(Redis 다운 등)가 사용자 요청 자체를 실패시키지 않도록 삼킨다.
   */
  async notifyAdmin(job: AdminNotificationJob) {
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

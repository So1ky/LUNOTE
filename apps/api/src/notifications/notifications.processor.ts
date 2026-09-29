import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { NOTIFICATIONS_QUEUE, NotificationJob } from './notifications.service';

/**
 * 알림 워커 — 외부 부수효과(이메일)만 담당한다.
 * 인앱 알림 행은 유발 트랜잭션에서 이미 생성됨 (DB-first, ARCHITECTURE §7).
 * 이메일 실패는 BullMQ 재시도 3회 후 최종 실패 허용.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    switch (job.data.type) {
      case 'ADMIN_NEW_REQUEST_EMAIL':
        return this.sendAdminEmails(job.data);
      case 'ADMIN_PAYMENT_PAID_EMAIL':
        return this.sendAdminPaymentPaidEmails(job.data);
    }
  }

  /** 결제 확정 → 모든 관리자에게 이메일 (착수 지연 방지) */
  private async sendAdminPaymentPaidEmails(data: {
    requestId: number;
    amount: string;
    currency: string;
    provider: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { email: true },
    });
    if (admins.length === 0) {
      this.logger.warn(
        '관리자 계정이 없어 결제 확정 이메일을 보낼 수 없습니다',
      );
      return;
    }
    for (const admin of admins) {
      await this.mail.send(
        admin.email,
        `[LUNOTE] 결제 확정 #${data.requestId} (${data.currency} ${data.amount})`,
        `문의 #${data.requestId}의 결제가 확정되었습니다.\n\n금액: ${data.currency} ${data.amount}\n채널: ${data.provider}\n\n작업을 시작하고 상태를 IN_PROGRESS로 변경하세요.`,
      );
    }
  }

  /** 신규 문의 → 모든 관리자에게 이메일 (앱을 안 보고 있어도 접수를 놓치지 않도록) */
  private async sendAdminEmails(data: {
    requestId: number;
    category: string;
    userEmail: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { email: true },
    });
    if (admins.length === 0) {
      this.logger.warn('관리자 계정이 없어 접수 이메일을 보낼 수 없습니다');
      return;
    }
    for (const admin of admins) {
      await this.mail.send(
        admin.email,
        `[LUNOTE] 새 문의 #${data.requestId} (${data.category})`,
        `새 문의가 접수되었습니다.\n\n문의 번호: #${data.requestId}\n카테고리: ${data.category}\n사용자: ${data.userEmail}\n\n앱 또는 관리자 API에서 확인 후 24시간 내에 견적을 발송하세요.`,
      );
    }
  }
}

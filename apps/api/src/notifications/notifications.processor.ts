import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import {
  NOTIFICATIONS_QUEUE,
  NotificationJob,
  QuoteSentJob,
  RequestCreatedJob,
} from './notifications.service';

/**
 * 알림 워커 — 잡 하나당 두 채널을 처리한다:
 * 1) 인앱 알림함(notifications 테이블) 생성 — 앱에서 GET /notifications로 조회
 * 2) 이메일 발송 (로컬: Mailpit, 프로덕션: SES)
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
      case 'REQUEST_CREATED':
        return this.onRequestCreated(job.data);
      case 'QUOTE_SENT':
        return this.onQuoteSent(job.data);
    }
  }

  /** 신규 문의 → 모든 관리자에게 인앱 + 이메일 */
  private async onRequestCreated(data: RequestCreatedJob) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true, email: true },
    });
    if (admins.length === 0) {
      this.logger.warn('관리자 계정이 없어 접수 알림을 보낼 수 없습니다');
      return;
    }

    const title = `New request #${data.requestId}`;
    const body = `${data.category} · ${data.userEmail}`;

    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: data.type,
        title,
        body,
        requestId: data.requestId,
      })),
    });

    for (const admin of admins) {
      await this.mail.send(
        admin.email,
        `[LUNOTE] 새 문의 #${data.requestId} (${data.category})`,
        `새 문의가 접수되었습니다.\n\n문의 번호: #${data.requestId}\n카테고리: ${data.category}\n사용자: ${data.userEmail}\n\n앱 또는 관리자 API에서 확인 후 24시간 내에 견적을 발송하세요.`,
      );
    }
  }

  /** 견적 발송 → 문의 소유자에게 인앱 + 이메일 */
  private async onQuoteSent(data: QuoteSentJob) {
    const owner = await this.prisma.user.findUnique({
      where: { id: data.ownerId },
      select: { id: true, email: true },
    });
    if (!owner) return;

    const amountText = `${data.currency === 'USD' ? '$' : `${data.currency} `}${Number(data.amount).toLocaleString()}`;

    await this.prisma.notification.create({
      data: {
        userId: owner.id,
        type: data.type,
        title: 'Your quote is ready',
        body: `Request #${data.requestId} · ${amountText}`,
        requestId: data.requestId,
      },
    });

    await this.mail.send(
      owner.email,
      `[LUNOTE] Your quote for request #${data.requestId} is ready`,
      `Good news — your quote is ready!\n\nRequest: #${data.requestId}\nQuote: ${amountText}\n\nOpen the LUNOTE app to review the details and proceed to payment.`,
    );
  }
}

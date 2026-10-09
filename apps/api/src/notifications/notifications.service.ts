import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { Queue } from 'bullmq';

export const NOTIFICATIONS_QUEUE = 'notifications';

/** 알림 문구용 금액 표기 — 통화별 UI 포맷은 앱이 담당하므로 여기선 단순 표기 */
function formatAmount(amount: string, currency: string) {
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString()}`;
}

/**
 * 큐에는 외부 부수효과(이메일)만 넣는다 — 실패해도 서비스 데이터는 무결.
 * 인앱 알림 행은 유발 트랜잭션 안에서 직접 생성한다 (DB-first, ARCHITECTURE §7).
 */
export type AdminEmailJob = {
  type: 'ADMIN_NEW_REQUEST_EMAIL';
  requestId: number;
  category: string;
};

export type AdminPaymentPaidEmailJob = {
  type: 'ADMIN_PAYMENT_PAID_EMAIL';
  requestId: number;
  amount: string;
  currency: string;
  provider: string;
};

export type NotificationJob = AdminEmailJob | AdminPaymentPaidEmailJob;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly queue: Queue<NotificationJob>,
  ) {}

  /**
   * 신규 문의 → 모든 관리자에게 인앱 알림 행 생성.
   * 반드시 문의 생성과 같은 트랜잭션(tx)으로 호출한다 — Redis와 무관하게 유실 불가.
   */
  async notifyAdminsRequestCreated(
    tx: Prisma.TransactionClient,
    data: { requestId: number; category: string; userEmail: string },
  ) {
    const admins = await tx.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (admins.length === 0) {
      this.logger.warn('관리자 계정이 없어 접수 인앱 알림을 만들 수 없습니다');
      return;
    }
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'REQUEST_CREATED',
        title: `New request #${data.requestId}`,
        body: `${data.category} · ${data.userEmail}`,
        requestId: data.requestId,
      })),
    });
  }

  /**
   * Apple ID 삭제 알림을 받았지만 결제 진행 중이라 탈퇴하지 못한 계정 → 관리자 수동 정리 신호.
   * 본문에는 사용자 ID만 — 이메일 등 개인정보를 싣지 않는다.
   */
  async notifyAdminsAppleAccountDeleted(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const admins = await tx.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (admins.length === 0) {
      this.logger.warn(
        '관리자 계정이 없어 Apple 계정 삭제 알림을 만들 수 없습니다',
      );
      return;
    }
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'APPLE_ACCOUNT_DELETED',
        title: 'Apple ID deleted — account pending deletion',
        body: `User ${userId}: delete via admin after the paid service is completed or refunded`,
      })),
    });
  }

  /** 견적 발송 → 문의 소유자에게 인앱 알림 행 생성 (견적 발행 트랜잭션 안에서 호출) */
  async notifyUserQuoteSent(
    tx: Prisma.TransactionClient,
    data: {
      requestId: number;
      ownerId: string;
      amount: string;
      currency: string;
    },
  ) {
    const amountText = formatAmount(data.amount, data.currency);
    await tx.notification.create({
      data: {
        userId: data.ownerId,
        type: 'QUOTE_SENT',
        title: 'Your quote is ready',
        body: `Request #${data.requestId} · ${amountText}`,
        requestId: data.requestId,
      },
    });
  }

  /** 결제 확정 → 소유자 + 모든 관리자에게 인앱 알림 (결제 확정 트랜잭션 안에서 호출) */
  async notifyPaymentPaid(
    tx: Prisma.TransactionClient,
    data: {
      requestId: number;
      ownerId: string;
      amount: string;
      currency: string;
    },
  ) {
    const amountText = formatAmount(data.amount, data.currency);
    const admins = await tx.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await tx.notification.createMany({
      data: [
        {
          userId: data.ownerId,
          type: 'PAYMENT_PAID',
          title: 'Payment received',
          body: `Request #${data.requestId} · ${amountText} — we're getting started`,
          requestId: data.requestId,
        },
        ...admins.map((a) => ({
          userId: a.id,
          type: 'PAYMENT_PAID',
          title: `Payment received #${data.requestId}`,
          body: `${amountText} · start the work`,
          requestId: data.requestId,
        })),
      ],
    });
  }

  /**
   * 결제 금액/통화 불일치 → 관리자에게만 인앱 알림. 상태 전이 없이 사람이 확인해야 하는
   * 비즈니스 이상 신호 (ARCHITECTURE §7 "금액 불일치 시 상태 변경 없이 알림만").
   */
  async notifyAdminsPaymentMismatch(
    tx: Prisma.TransactionClient,
    data: { requestId: number; paymentId: string; reason: string },
  ) {
    const admins = await tx.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (admins.length === 0) {
      this.logger.error(
        `결제 불일치를 알릴 관리자 계정이 없습니다 (payment ${data.paymentId})`,
      );
      return;
    }
    await tx.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'PAYMENT_MISMATCH',
        title: `Payment mismatch #${data.requestId}`,
        body: `${data.reason} · payment ${data.paymentId}`,
        requestId: data.requestId,
      })),
    });
  }

  /**
   * 관리자 이메일 발송 잡 등록 — 트랜잭션 커밋 이후에 호출한다
   * (커밋 전에 넣으면 롤백된 문의의 메일이 나갈 수 있다).
   *
   * 반드시 fire-and-forget: Redis 다운 시 add()는 reject되지 않고 재연결까지
   * '대기'하므로(ioredis offline queue) await하면 HTTP 응답이 무한 블록된다
   * (실측 확인). 프로세스가 살아 있으면 재연결 시점에 잡이 자동 등록된다.
   */
  enqueueAdminEmail(job: NotificationJob) {
    void this.queue
      .add(job.type, job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100, // 최근 100건만 보관
        removeOnFail: 500,
      })
      .catch((e: Error) =>
        this.logger.error(`알림 큐 등록 실패: ${e.message}`),
      );
  }

  /** 헬스체크용 — Redis 응답 여부 (500ms 타임아웃, 실패해도 예외를 던지지 않는다) */
  async isQueueUp(): Promise<boolean> {
    try {
      // BullMQ의 IRedisClient 타입에 ping이 빠져 있으나 ioredis/node-redis 둘 다 지원한다
      // (겹치는 속성이 없는 타입이라 TS 규칙상 unknown을 경유해 단언)
      const client = (await this.queue.client) as unknown as {
        ping(): Promise<string>;
      };
      await Promise.race([
        client.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('redis ping timeout')), 500),
        ),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

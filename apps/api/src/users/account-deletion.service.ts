import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus, UserRole } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { Queue } from 'bullmq';
import { MetricsService } from '../observability/metrics.service';
import { PrismaService } from '../prisma/prisma.service';

export const ACCOUNT_CLEANUP_QUEUE = 'account-cleanup';
export type AccountCleanupJob = { userId: string };

/** 익명화 이메일 — unique 제약 유지, .invalid(RFC 2606 예약 TLD)라 메일이 나갈 수 없다 */
export const deletedEmail = (userId: string) =>
  `deleted+${userId}@deleted.lunoteapp.invalid`;

/** 결제가 끝나 서비스가 진행 중인 상태 — 완료·환불 전 탈퇴 불가 */
const BLOCKING: RequestStatus[] = [
  RequestStatus.PAID,
  RequestStatus.IN_PROGRESS,
];
const CANCELLABLE: RequestStatus[] = [
  RequestStatus.REVIEWING,
  RequestStatus.QUOTED,
];

/**
 * 계정 삭제 = 즉시 익명화 + 법정 보존 거래 기록만 유지 (ARCHITECTURE §11 계정 삭제).
 * 사용자 경로(DELETE /users/me)와 관리자 대행 경로(DELETE /admin/users/:id)가 공유한다.
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    @InjectQueue(ACCOUNT_CLEANUP_QUEUE)
    private readonly queue: Queue<AccountCleanupJob>,
  ) {}

  async deleteAccount(userId: string, actorAdminId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 사용자 행 잠금 — 사용자·관리자 경로의 동시 삭제를 직렬화 (두 번째는 아래에서 404)
      // FOR UPDATE가 아닌 NO KEY UPDATE: 결제 확정 트랜잭션의 알림 INSERT가 FK로 users 행에 KEY SHARE를 잡으므로 FOR UPDATE면 교착 가능
      // 마지막 tx.user.update가 유니크 인덱스 컬럼(email, providerId)을 바꾸므로 그 시점에 행 잠금이 승격된다.
      // 결제 확정 경로는 users KEY SHARE를 마지막에 잡고 바로 커밋하므로 안전하다.
      // 관리자 createQuote와의 교착은 이론상 가능하나 PostgreSQL이 감지해 한쪽을 롤백한다(500, 데이터 손상 없음)
      const [user] = await tx.$queryRaw<
        { role: UserRole; deletedAt: Date | null }[]
      >`SELECT role, "deletedAt" FROM users WHERE id = ${userId} FOR NO KEY UPDATE`;
      if (!user || user.deletedAt) {
        throw new NotFoundException('User not found');
      }
      if (user.role === UserRole.ADMIN) {
        // 관리자는 감사 로그의 주체 — 삭제 대상이 아니다
        throw new ForbiddenException('Admin accounts cannot be deleted');
      }

      // 취소를 먼저 실행해 행을 잠근 뒤 차단 조건을 본다. 결제 확정이 QUOTED→PAID를 먼저 커밋했으면
      // 아래 count가 잡고, 우리가 먼저 잠갔으면 결제 쪽이 request_status 불일치로 관리자에게 알린다.
      await tx.quoteRequest.updateMany({
        where: { userId, status: { in: CANCELLABLE } },
        data: { status: RequestStatus.CANCELLED },
      });
      const active = await tx.quoteRequest.count({
        where: { userId, status: { in: BLOCKING } },
      });
      if (active > 0) {
        this.metrics.accountDeletion('blocked');
        throw new ConflictException(
          'A paid service is in progress — the account can be deleted after it is completed or refunded',
        );
      }

      // 결제 행이 하나라도 있으면 거래 기록(전자상거래법 5년)으로 보존, 없으면 통째 삭제
      const requests = await tx.quoteRequest.findMany({
        where: { userId },
        select: {
          id: true,
          quote: { select: { _count: { select: { payments: true } } } },
        },
      });
      const allIds = requests.map((r) => r.id);
      const unpaidIds = requests
        .filter((r) => !r.quote || r.quote._count.payments === 0)
        .map((r) => r.id);

      await tx.attachment.deleteMany({ where: { requestId: { in: allIds } } });
      await tx.quote.deleteMany({ where: { requestId: { in: unpaidIds } } });
      await tx.quoteRequest.deleteMany({ where: { id: { in: unpaidIds } } });
      // 남은 문의 = 보존 대상. 연락처는 보존 의무가 없다
      await tx.quoteRequest.updateMany({
        where: { userId },
        data: { contactMethod: '' },
      });
      // 본인 알림 + 본문에 사용자 이메일이 든 관리자 REQUEST_CREATED 알림만 지운다.
      // PAYMENT_MISMATCH/PAYMENT_PAID 관리자 알림은 환불 신호이고 개인정보가 없어 보존
      await tx.notification.deleteMany({
        where: {
          OR: [
            { userId },
            { requestId: { in: allIds }, type: 'REQUEST_CREATED' },
          ],
        },
      });
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          email: deletedEmail(userId),
          passwordHash: null,
          providerId: null,
          firstName: null,
          lastName: null,
          nationality: null,
          language: null,
          avatarS3Key: null,
          verificationCodeHash: null,
          verificationCodeExpiresAt: null,
          verificationAttempts: 0,
          passwordResetCodeHash: null,
          passwordResetCodeExpiresAt: null,
          passwordResetAttempts: 0,
          deletedAt: new Date(),
        },
      });
      if (actorAdminId) {
        // 대행 삭제는 감사 로그와 같은 트랜잭션 — 기록 없는 삭제가 존재할 수 없게
        await tx.adminAuditLog.create({
          data: {
            adminId: actorAdminId,
            action: 'ACCOUNT_DELETED',
            targetType: 'USER',
            targetId: userId,
          },
        });
      }
    });

    this.metrics.accountDeletion('deleted');
    this.logger.log(`계정 삭제 완료 user=${userId}`);
    this.enqueueCleanup(userId);
  }

  /**
   * 커밋 이후에만 등록 — 롤백된 삭제의 파일을 지우면 안 된다.
   * fire-and-forget: Redis 다운 시 add()가 재연결까지 대기하므로 await하면 응답이 막힌다(NotificationsService와 동일).
   */
  private enqueueCleanup(userId: string) {
    void this.queue
      .add(
        'cleanup',
        { userId },
        {
          jobId: `cleanup-${userId}`,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      )
      .catch((e: Error) => {
        this.logger.error(
          `계정 정리 잡 등록 실패 user=${userId}: ${e.message}`,
        );
        Sentry.captureException(e, { extra: { userId } });
      });
  }
}

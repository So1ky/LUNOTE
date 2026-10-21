import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, Prisma, RequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MetricsService } from '../observability/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';

/** 목록/상세 응답에서 노출할 필드 (내부 컬럼 전체 노출 금지) */
const REQUEST_SELECT = {
  id: true,
  category: true,
  serviceItem: true,
  desiredAmount: true,
  currency: true,
  paymentMethod: true,
  description: true,
  contactMethod: true,
  status: true,
  rejectionReason: true, // 관리자 거절 사유 — REJECTED일 때만 값이 있다
  // 완료 확인 절차 — 앱이 기한을 표시하고, 이의제기 사유는 고객 본인 기록용
  completionNoticedAt: true,
  confirmationDeadlineAt: true,
  disputeReason: true,
  disputedAt: true,
  createdAt: true,
  updatedAt: true,
  quote: {
    select: {
      id: true,
      amount: true,
      currency: true,
      explanation: true,
      expiresAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

/** 상세 전용 — 첨부파일 포함 (목록에서는 무게를 줄이기 위해 제외) */
const REQUEST_DETAIL_SELECT = {
  ...REQUEST_SELECT,
  attachments: {
    select: {
      id: true,
      s3Key: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

/** 사용자가 직접 취소할 수 있는 상태 — 결제 이후(PAID~)는 관리자/환불 플로우로만 */
const CANCELLABLE: RequestStatus[] = [
  RequestStatus.REVIEWING,
  RequestStatus.QUOTED,
];

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly metrics: MetricsService,
  ) {}

  async create(userId: string, userEmail: string, dto: CreateQuoteRequestDto) {
    // 소유권 검증: presign이 발급한 키는 항상 본인 프리픽스로 시작한다.
    // 다른 사용자의 키(또는 임의 경로)를 첨부하려는 시도를 차단.
    // 서비스 항목은 선택한 카테고리에 종속 — 다른 카테고리의 항목 ID는 거부
    if (dto.serviceItem && !dto.serviceItem.startsWith(`${dto.category}_`)) {
      throw new BadRequestException(
        'serviceItem does not belong to the selected category',
      );
    }

    const myPrefix = `uploads/${userId}/`;
    for (const att of dto.attachments ?? []) {
      if (!att.s3Key.startsWith(myPrefix)) {
        throw new BadRequestException('Invalid attachment key');
      }
    }

    // 문의 생성 + 관리자 인앱 알림을 한 트랜잭션으로 — 알림 유실 불가 (DB-first)
    const created = await this.prisma.$transaction(async (tx) => {
      const request = await tx.quoteRequest.create({
        data: {
          userId,
          category: dto.category,
          serviceItem: dto.serviceItem,
          desiredAmount: dto.desiredAmount,
          currency: dto.currency ?? 'USD',
          paymentMethod: dto.paymentMethod ?? PaymentMethod.PAYPAL,
          description: dto.description,
          contactMethod: dto.contactMethod,
          attachments: dto.attachments?.length
            ? {
                create: dto.attachments.map((a) => ({
                  s3Key: a.s3Key,
                  fileName: a.fileName,
                  mimeType: a.mimeType,
                  sizeBytes: a.sizeBytes,
                })),
              }
            : undefined,
        },
        select: REQUEST_SELECT,
      });
      await this.notifications.notifyAdminsRequestCreated(tx, {
        requestId: request.id,
        category: request.category,
        userEmail,
      });
      return request;
    });

    // 이메일은 커밋 이후 큐로 (fire-and-forget — 인앱 알림은 이미 존재)
    this.notifications.enqueueAdminEmail({
      type: 'ADMIN_NEW_REQUEST_EMAIL',
      requestId: created.id,
      category: created.category,
    });

    return created;
  }

  findMine(userId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { userId }, // IDOR 방지의 핵심: 항상 소유자 조건을 쿼리에 포함
      orderBy: { createdAt: 'desc' },
      select: REQUEST_SELECT,
      take: 100, // 안전 상한 — 커서 페이지네이션은 규모가 커지면 도입 (2026-07-24 결정)
    });
  }

  async findOne(userId: string, id: number) {
    // 소유자 조건을 where에 포함 — 남의 문의는 "없는 것"과 동일하게 404.
    // (403을 주면 "그 ID가 존재한다"는 정보가 새어나간다)
    const request = await this.prisma.quoteRequest.findFirst({
      where: { id, userId },
      select: REQUEST_DETAIL_SELECT,
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }

    // 버킷은 비공개 — 첨부마다 1시간짜리 다운로드 URL을 발급해 응답에 포함
    const attachments = await Promise.all(
      request.attachments.map(async (a) => ({
        ...a,
        downloadUrl: await this.storage.presignDownload(a.s3Key),
      })),
    );
    return { ...request, attachments };
  }

  async cancel(userId: string, id: number) {
    // 존재+소유권만 확인 (없으면 404) — presign까지 하는 findOne은 반환 시 한 번만
    const exists = await this.prisma.quoteRequest.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Quote request not found');
    }

    // 상태 조건까지 updateMany의 where에 포함해 동시 요청에도 안전하게 처리
    const { count } = await this.prisma.quoteRequest.updateMany({
      where: { id, userId, status: { in: CANCELLABLE } },
      data: { status: RequestStatus.CANCELLED },
    });
    if (count === 0) {
      throw new ConflictException(
        'Only requests in REVIEWING or QUOTED status can be cancelled',
      );
    }
    return this.findOne(userId, id);
  }

  /** 고객의 완료 확인 — AWAITING_CONFIRMATION → COMPLETED. 본인이 확인했으니 완료 알림은 보내지 않는다 (약관 제6조) */
  async confirmCompletion(userId: string, id: number) {
    await this.assertOwned(userId, id);
    const { count } = await this.prisma.quoteRequest.updateMany({
      where: { id, userId, status: RequestStatus.AWAITING_CONFIRMATION },
      data: { status: RequestStatus.COMPLETED },
    });
    if (count === 0) {
      throw new ConflictException(
        'Only requests awaiting confirmation can be confirmed',
      );
    }
    return this.findOne(userId, id);
  }

  /**
   * 고객의 이의제기 — AWAITING_CONFIRMATION → IN_PROGRESS + 사유 저장 + 통지 필드 초기화 + 관리자 인앱 알림(같은 트랜잭션) + 메일(커밋 후).
   * 관리자가 처리한 뒤 다시 완료를 통지하면 새 기한이 시작된다
   */
  async dispute(userId: string, id: number, reason: string) {
    await this.assertOwned(userId, id);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.quoteRequest.updateMany({
        where: { id, userId, status: RequestStatus.AWAITING_CONFIRMATION },
        data: {
          status: RequestStatus.IN_PROGRESS,
          disputeReason: reason,
          disputedAt: new Date(),
          completionNoticedAt: null,
          confirmationDeadlineAt: null,
        },
      });
      if (count === 0) {
        throw new ConflictException(
          'Only requests awaiting confirmation can be disputed',
        );
      }
      await this.notifications.notifyAdminsDispute(tx, {
        requestId: id,
        reason,
      });
    });
    this.notifications.enqueueAdminEmail({
      type: 'ADMIN_DISPUTE_EMAIL',
      requestId: id,
    });
    return this.findOne(userId, id);
  }

  /**
   * 확인 기한이 지난 AWAITING_CONFIRMATION을 자동 완료한다 (CompletionProcessor가 1시간마다 호출).
   * 건별 조건부 updateMany라 동시에 두 번 돌아도, 그 사이 고객이 확인·이의제기해도 한 번만 전이된다.
   * 완료 통지(재차 통지를 겸함)는 전이와 같은 트랜잭션, 푸시는 커밋 뒤. 반환값 = 완료 처리 건수
   */
  async autoCompleteExpired(now: Date): Promise<number> {
    const due = await this.prisma.quoteRequest.findMany({
      where: {
        status: RequestStatus.AWAITING_CONFIRMATION,
        confirmationDeadlineAt: { lte: now },
      },
      select: { id: true, userId: true },
      take: 200, // 한 주기 상한 — 남은 건은 다음 주기에
    });
    let completed = 0;
    for (const { id, userId } of due) {
      const notice = await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.quoteRequest.updateMany({
          where: {
            id,
            status: RequestStatus.AWAITING_CONFIRMATION,
            confirmationDeadlineAt: { lte: now },
          },
          data: { status: RequestStatus.COMPLETED },
        });
        if (count === 0) return null;
        return this.notifications.notifyUserWorkStatus(tx, {
          requestId: id,
          ownerId: userId,
          status: RequestStatus.COMPLETED,
        });
      });
      if (!notice) continue;
      completed++;
      this.notifications.enqueueUserPush({
        type: 'USER_PUSH',
        userId,
        requestId: id,
        ...notice,
      });
    }
    this.metrics.requestAutoCompleted(completed);
    return completed;
  }

  /** 존재+소유권만 확인 (없으면 404) — 상태 검사는 호출자가 조건부 updateMany로 한다 */
  private async assertOwned(userId: string, id: number) {
    const exists = await this.prisma.quoteRequest.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Quote request not found');
    }
  }
}

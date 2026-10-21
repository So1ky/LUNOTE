import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, Prisma, RequestStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  addBusinessDays,
  CONFIRMATION_BUSINESS_DAYS,
} from '../quote-requests/business-days';
import { StorageService } from '../storage/storage.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import type { AdminSettableStatus } from './dto/update-request-status.dto';

/** 결제수단 → 견적 통화. 관리자는 통화를 고르지 않는다 (스펙 §3-2) */
const CURRENCY_BY_METHOD: Record<PaymentMethod, string> = {
  [PaymentMethod.PAYPAL]: 'USD',
  [PaymentMethod.BANK_TRANSFER]: 'KRW',
};

/**
 * 통화별 견적 상한 — USD 100만 달러 / KRW 1억 원. 둘 다 Decimal(12,2) 범위 안이다.
 * DTO의 @Max는 통화를 모르므로 가장 큰 상한(KRW)만 걸고, 통화가 정해진 뒤 여기서 좁힌다
 */
const MAX_BY_CURRENCY: Record<string, number> = {
  USD: 1_000_000,
  KRW: 100_000_000,
};

/**
 * 관리자 수동 전이 — 목표 상태 → 요구되는 현재 상태 (건너뛰기 불가).
 * PAYMENT_RECEIVED → PAID는 PayPal 결제의 관리자 확인 (2026-10-20 기획 결정, ARCHITECTURE §7)
 */
const REQUIRED_CURRENT: Record<AdminSettableStatus, RequestStatus> = {
  [RequestStatus.PAID]: RequestStatus.PAYMENT_RECEIVED,
  [RequestStatus.IN_PROGRESS]: RequestStatus.PAID,
  [RequestStatus.AWAITING_CONFIRMATION]: RequestStatus.IN_PROGRESS, // 완료 통지
  [RequestStatus.COMPLETED]: RequestStatus.AWAITING_CONFIRMATION, // 관리자 강제 완료 — 고객 확인·자동 완료의 비상 대체
};

/** 관리자 화면용 — 사용자 요약 정보를 포함해 노출한다 */
const ADMIN_REQUEST_SELECT = {
  id: true,
  category: true,
  serviceItem: true,
  desiredAmount: true,
  currency: true,
  paymentMethod: true,
  description: true,
  contactMethod: true,
  status: true,
  rejectionReason: true,
  completionNoticedAt: true,
  confirmationDeadlineAt: true,
  disputeReason: true,
  disputedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nationality: true,
      language: true,
    },
  },
  quote: {
    select: {
      id: true,
      amount: true,
      currency: true,
      explanation: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.QuoteRequestSelect;

/** 상세 전용 — 첨부파일 포함 */
const ADMIN_DETAIL_SELECT = {
  ...ADMIN_REQUEST_SELECT,
  quote: {
    select: {
      ...ADMIN_REQUEST_SELECT.quote.select,
      // 관리자 웹이 "입금 확인" 대상(PENDING 계좌이체)을 알기 위한 최근 결제 — 최신 5개
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  },
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

@Injectable()
export class AdminQuoteRequestsService {
  private readonly QUOTE_VALIDITY_DAYS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    this.QUOTE_VALIDITY_DAYS = Number(config.getOrThrow('QUOTE_VALIDITY_DAYS'));
  }

  findAll(status?: RequestStatus) {
    return this.prisma.quoteRequest.findMany({
      // 탈퇴 사용자의 보존 기록은 운영 화면에서 분리 (개인정보보호법 §21③, 분쟁 시 DB 직접 조회)
      where: { ...(status ? { status } : {}), user: { deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      select: ADMIN_REQUEST_SELECT,
      take: 200, // 안전 상한 — 커서 페이지네이션은 규모가 커지면 도입 (2026-07-24 결정)
    });
  }

  async findOne(id: number) {
    const request = await this.prisma.quoteRequest.findFirst({
      where: { id, user: { deletedAt: null } },
      select: ADMIN_DETAIL_SELECT,
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }
    const attachments = await Promise.all(
      request.attachments.map(async (a) => ({
        ...a,
        downloadUrl: await this.storage.presignDownload(a.s3Key),
      })),
    );
    return { ...request, attachments };
  }

  /** 견적 발송: Quote 생성 + REVIEWING → QUOTED 전이 + 감사 로그를 한 트랜잭션으로 */
  async createQuote(requestId: number, dto: CreateQuoteDto, adminId: string) {
    const request = await this.findOne(requestId);

    if (request.quote) {
      // 견적은 발행 후 불변 — 수정/재발행 불가 (제품 결정 2026-07-24)
      throw new ConflictException(
        'Quote already exists — quotes are immutable',
      );
    }
    if (request.status !== RequestStatus.REVIEWING) {
      throw new ConflictException(
        `Cannot quote a request in ${request.status} status`,
      );
    }

    const currency = CURRENCY_BY_METHOD[request.paymentMethod];
    if (dto.amount > MAX_BY_CURRENCY[currency]) {
      throw new BadRequestException('AMOUNT_TOO_LARGE');
    }
    if (dto.currency && dto.currency !== currency) {
      throw new BadRequestException('CURRENCY_MISMATCH');
    }
    // KRW는 최소 단위가 1원 — 소수점 금액은 결제 불가 (toMinorUnits가 던지기 전에 막는다)
    if (currency === 'KRW' && !Number.isInteger(dto.amount)) {
      throw new BadRequestException('KRW amount must be a whole number');
    }

    // 발행 후 불변 + 유효기간 — 만료 시 결제 불가 (ARCHITECTURE §7)
    const expiresAt = new Date(
      Date.now() + this.QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
    );

    const notice = await this.prisma.$transaction(async (tx) => {
      await tx.quote.create({
        data: {
          requestId,
          amount: dto.amount,
          currency,
          explanation: dto.explanation,
          expiresAt,
        },
      });
      // 상태 조건을 다시 걸어 동시 견적 발송 경쟁을 차단
      const { count } = await tx.quoteRequest.updateMany({
        where: { id: requestId, status: RequestStatus.REVIEWING },
        data: { status: RequestStatus.QUOTED },
      });
      if (count === 0) {
        throw new ConflictException('Request status changed concurrently');
      }
      // 감사 로그 — 견적 발행과 같은 트랜잭션 (기록 없는 발행이 존재할 수 없게)
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'QUOTE_CREATED',
          targetType: 'QUOTE_REQUEST',
          targetId: String(requestId),
          detail: {
            amount: dto.amount,
            currency,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
      // 사용자 인앱 알림도 같은 트랜잭션 — 발행됐는데 알림이 없는 상태가 불가능 (DB-first)
      return this.notifications.notifyUserQuoteSent(tx, {
        requestId,
        ownerId: request.user.id,
        amount: String(dto.amount),
        currency,
      });
    });
    // 푸시는 커밋 뒤에 — 롤백된 견적의 푸시가 나가면 안 된다 (인앱 알림이 원천)
    this.notifications.enqueueUserPush({
      type: 'USER_PUSH',
      userId: request.user.id,
      requestId,
      ...notice,
    });

    return this.findOne(requestId);
  }

  /**
   * 거절 — REVIEWING(견적 전)에서만. 사유는 저장·감사 로그·사용자 알림 본문으로 모두 남긴다.
   * 사용자 취소(CANCELLED)와 다른 종결 상태 (ARCHITECTURE §7 REJECTED)
   */
  async reject(requestId: number, reason: string, adminId: string) {
    const request = await this.prisma.quoteRequest.findFirst({
      where: { id: requestId, user: { deletedAt: null } },
      select: { status: true, userId: true },
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }
    if (request.status !== RequestStatus.REVIEWING) {
      throw new ConflictException(
        `Cannot reject a request in ${request.status} status`,
      );
    }

    const notice = await this.prisma.$transaction(async (tx) => {
      // 상태 조건을 다시 걸어 동시 견적 발송·사용자 취소와의 경쟁을 차단
      const { count } = await tx.quoteRequest.updateMany({
        where: { id: requestId, status: RequestStatus.REVIEWING },
        data: { status: RequestStatus.REJECTED, rejectionReason: reason },
      });
      if (count === 0) {
        throw new ConflictException('Request status changed concurrently');
      }
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REQUEST_REJECTED',
          targetType: 'QUOTE_REQUEST',
          targetId: String(requestId),
          detail: { reason },
        },
      });
      return this.notifications.notifyUserRequestRejected(tx, {
        requestId,
        ownerId: request.userId,
        reason,
      });
    });
    // 푸시는 커밋 뒤에 — 인앱 알림이 원천 (견적 발송과 동일)
    this.notifications.enqueueUserPush({
      type: 'USER_PUSH',
      userId: request.userId,
      requestId,
      ...notice,
    });

    return this.findOne(requestId);
  }

  /**
   * 상태 수동 전이 — PAYMENT_RECEIVED → PAID(PayPal 결제 확인), PAID → IN_PROGRESS, IN_PROGRESS → COMPLETED.
   * 감사 로그·사용자 알림은 같은 트랜잭션
   */
  async updateStatus(
    requestId: number,
    status: AdminSettableStatus,
    adminId: string,
  ) {
    const from = REQUIRED_CURRENT[status];
    // 탈퇴 사용자의 문의는 findOne과 같은 조건으로 제외 (탈퇴 계정에 알림을 만들지 않도록)
    const request = await this.prisma.quoteRequest.findFirst({
      where: { id: requestId, user: { deletedAt: null } },
      select: { status: true, userId: true },
    });
    if (!request) {
      throw new NotFoundException('Quote request not found');
    }
    if (request.status !== from) {
      throw new ConflictException(
        `Cannot move a request in ${request.status} status to ${status}`,
      );
    }

    // 완료 통지면 통지 시각과 확인 기한(+5영업일)을 함께 기록 — 자동 완료 스캔과 앱 표시가 이 값을 쓴다
    const noticedAt = new Date();
    const completionFields =
      status === RequestStatus.AWAITING_CONFIRMATION
        ? {
            completionNoticedAt: noticedAt,
            confirmationDeadlineAt: addBusinessDays(
              noticedAt,
              CONFIRMATION_BUSINESS_DAYS,
            ),
          }
        : {};

    const notice = await this.prisma.$transaction(async (tx) => {
      // 상태 조건을 where에 다시 걸어 동시 클릭·웹훅(환불)과의 경쟁을 차단
      const { count } = await tx.quoteRequest.updateMany({
        where: { id: requestId, status: from },
        data: { status, ...completionFields },
      });
      if (count === 0) {
        throw new ConflictException('Request status changed concurrently');
      }
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REQUEST_STATUS_CHANGED',
          targetType: 'QUOTE_REQUEST',
          targetId: String(requestId),
          detail: { from, to: status },
        },
      });
      return this.notifications.notifyUserWorkStatus(tx, {
        requestId,
        ownerId: request.userId,
        status,
      });
    });
    // 푸시는 커밋 뒤에 — 인앱 알림이 원천 (견적 발송과 동일)
    this.notifications.enqueueUserPush({
      type: 'USER_PUSH',
      userId: request.userId,
      requestId,
      ...notice,
    });

    return this.findOne(requestId);
  }

  // 견적 수정 API는 두지 않는다 — 발행 후 불변 (제품 결정 2026-07-24, ARCHITECTURE §7)
}

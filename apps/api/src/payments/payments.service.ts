import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { NotificationsService } from '../notifications/notifications.service';
import { MetricsService } from '../observability/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { BankTransferConfig } from './bank-transfer.config';
import { toMinorUnits } from './currency';
import {
  PortOneGateway,
  type PortOnePayment,
  type PortOneWebhookEvent,
} from './portone.gateway';

/** 통화 → 결제 채널 라우팅 (앱은 provider로 UI를 분기) */
const PROVIDER_BY_CURRENCY: Record<string, PaymentProvider> = {
  USD: PaymentProvider.PAYPAL,
  KRW: PaymentProvider.BANK_TRANSFER, // 수동 계좌이체 (INICIS 도입 전까지)
};

/** 앱이 PayPal 결제 UI를 띄우는 데 필요한 값 — 시크릿은 절대 포함하지 않는다 (storeId/channelKey는 공개 식별자) */
export type PayPalIntent = {
  provider: 'PAYPAL';
  paymentId: string;
  storeId: string;
  channelKey: string;
  orderName: string;
  /** PortOne totalAmount — 통화 최소 단위 정수 (USD 센트) */
  totalAmount: number;
  currency: string;
  /** 표시용 원 금액 (Decimal 문자열) */
  amount: string;
};

/** 앱이 계좌 안내 카드를 그리는 데 필요한 값 */
export type BankTransferIntent = {
  provider: 'BANK_TRANSFER';
  paymentId: string;
  amount: string;
  currency: string;
  bank: { name: string; accountNumber: string; holder: string };
  /** 입금자명 — LUNOTE + 요청 번호. 관리자가 입금 내역과 대조한다 */
  depositorName: string;
  /** 입금 기한 = 견적 만료 (ISO) */
  deadline: string;
};

export type PaymentIntent = PayPalIntent | BankTransferIntent;

/** 웹훅/확인 처리의 결과 — 로그·테스트용. 클라이언트에는 상태만 나간다 */
export type SyncOutcome =
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'mismatch'
  | 'noop'
  | 'duplicate'
  | 'unknown_payment';

const PAYMENT_SELECT = {
  id: true,
  quoteId: true,
  provider: true,
  amount: true,
  currency: true,
  status: true,
  paidAt: true,
  createdAt: true,
} satisfies Prisma.PaymentSelect;

/** markPaid가 필요로 하는 결제 행 — applyRemote의 local select와 confirmBankTransfer의 select가 둘 다 만족한다 */
type PaidTarget = {
  id: string;
  amount: Prisma.Decimal;
  currency: string;
  provider: PaymentProvider;
  quote: { requestId: number; request: { userId: string } };
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly portone: PortOneGateway,
    private readonly notifications: NotificationsService,
    private readonly metrics: MetricsService,
    private readonly bankTransfer: BankTransferConfig,
  ) {}

  /**
   * 결제 의도 생성: 견적 검증(소유·상태·만료) 후 PENDING Payment 행을 만들고
   * 앱이 결제 UI를 띄울 값을 돌려준다. 금액은 서버의 Quote에서만 온다.
   */
  async createIntent(userId: string, quoteId: string): Promise<PaymentIntent> {
    // 소유자 조건을 where에 포함 — 남의 견적은 404 (존재 여부를 노출하지 않는다)
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, request: { userId } },
      select: {
        id: true,
        amount: true,
        currency: true,
        expiresAt: true,
        request: { select: { id: true, category: true, status: true } },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.request.status !== RequestStatus.QUOTED) {
      throw new ConflictException('QUOTE_NOT_PAYABLE');
    }
    if (quote.expiresAt.getTime() < Date.now()) {
      throw new ConflictException('QUOTE_EXPIRED');
    }
    const provider = PROVIDER_BY_CURRENCY[quote.currency];
    if (!provider) throw new ConflictException('UNSUPPORTED_CURRENCY');

    // 채널별 설정 검사 — 어느 쪽도 미설정이면 503 (기동은 되지만 그 수단만 불가)
    if (provider === PaymentProvider.PAYPAL && !this.portone.isConfigured) {
      throw new ServiceUnavailableException('PAYMENTS_NOT_CONFIGURED');
    }
    if (
      provider === PaymentProvider.BANK_TRANSFER &&
      !this.bankTransfer.isConfigured
    ) {
      throw new ServiceUnavailableException('BANK_TRANSFER_NOT_CONFIGURED');
    }

    // 미완료 시도가 있으면 재사용 — PortOne은 미결제 paymentId 재요청을 허용하고, 행 남발을 막는다.
    // 사유가 붙은 PENDING(금액 불일치)은 PG에선 이미 결제된 건이라 재사용 대상이 아니다
    const existing = await this.prisma.payment.findFirst({
      where: {
        quoteId: quote.id,
        status: PaymentStatus.PENDING,
        provider,
        failReason: null,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const payment =
      existing ??
      (await this.prisma.payment.create({
        data: {
          quoteId: quote.id,
          provider,
          amount: quote.amount,
          currency: quote.currency,
          // DTO가 withdrawalConsent=true를 보장한다 — 여기 도달 = 동의한 시점
          withdrawalConsentAt: new Date(),
        },
        select: { id: true },
      }));

    if (provider === PaymentProvider.BANK_TRANSFER) {
      return {
        provider: 'BANK_TRANSFER',
        paymentId: payment.id,
        amount: quote.amount.toString(),
        currency: quote.currency,
        bank: this.bankTransfer.bank!,
        depositorName: `LUNOTE${quote.request.id}`,
        deadline: quote.expiresAt.toISOString(),
      };
    }
    return {
      provider: 'PAYPAL',
      paymentId: payment.id,
      storeId: this.portone.storeId!,
      channelKey: this.portone.paypalChannelKey!,
      orderName: `LUNOTE #${quote.request.id} ${quote.request.category}`,
      totalAmount: toMinorUnits(quote.amount, quote.currency),
      currency: quote.currency,
      amount: quote.amount.toString(),
    };
  }

  async findOne(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, quote: { request: { userId } } },
      select: { ...PAYMENT_SELECT, quote: { select: { requestId: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * 앱 콜백 후 호출되는 확인 — 앱이 보낸 결과는 신뢰하지 않고 PortOne 조회 API로 다시 검증한다.
   * 웹훅과 같은 전이 함수를 쓰므로 어느 쪽이 먼저 와도 결과는 같다 (멱등).
   */
  async confirm(userId: string, paymentId: string) {
    await this.findOne(userId, paymentId); // 소유권 검증
    const remote = await this.fetchRemote(paymentId);
    if (remote) {
      await this.prisma.$transaction((tx) => this.applyRemote(tx, remote));
    }
    return this.findOne(userId, paymentId);
  }

  /**
   * PortOne 웹훅 처리. 호출 전 서명 검증은 컨트롤러에서 끝난 상태.
   * 이벤트 기록(UNIQUE eventId) + 상태 전이를 한 트랜잭션으로 — 중간 실패 시 둘 다 롤백돼
   * PortOne 재전송이 다시 처리할 수 있다 (ARCHITECTURE §7).
   */
  async handleWebhook(
    eventId: string,
    event: PortOneWebhookEvent,
  ): Promise<SyncOutcome> {
    // Unrecognized(미래에 추가될 타입)는 symbol — 문자열로 정규화해 기록한다
    const eventType =
      typeof event.type === 'string' ? event.type : 'UNRECOGNIZED';
    const paymentId =
      'data' in event && event.data && 'paymentId' in event.data
        ? event.data.paymentId
        : null;

    // 모르는 결제(다른 상점/테스트 콘솔 발송 등)는 기록만 하고 200 — 재전송 유도 이유 없음
    const local = paymentId
      ? await this.prisma.payment.findUnique({
          where: { id: paymentId },
          select: { id: true },
        })
      : null;
    if (!local) {
      this.metrics.webhookFailure('unknown_payment');
      this.logger.warn(
        `알 수 없는 결제의 웹훅: type=${eventType} paymentId=${paymentId ?? '-'}`,
      );
      return 'unknown_payment';
    }

    // 조회 API는 네트워크 호출 — 트랜잭션 밖에서 먼저 (DB 커넥션을 오래 점유하지 않는다)
    const remote = await this.fetchRemote(local.id);

    return this.prisma.$transaction(async (tx) => {
      try {
        await tx.paymentEvent.create({
          data: {
            eventId,
            paymentId: local.id,
            type: eventType,
            payload: event as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          return 'duplicate'; // 재전송된 동일 이벤트 — 이미 처리됨
        }
        throw e;
      }
      return remote ? this.applyRemote(tx, remote) : 'noop';
    });
  }

  private async fetchRemote(paymentId: string): Promise<PortOnePayment | null> {
    try {
      return await this.portone.getPayment(paymentId);
    } catch (e) {
      // PAYMENT_NOT_FOUND: 결제창을 띄웠지만 PG에 아무 시도도 안 남은 경우 — 정상 (아직 결제 안 함)
      if (
        (e as { data?: { type?: string } })?.data?.type === 'PAYMENT_NOT_FOUND'
      ) {
        return null;
      }
      throw e;
    }
  }

  /**
   * 관리자 입금 확인 (수동 계좌이체). PG 밖 경로라 외부 조회 없이 관리자의 확인이 곧 증빙.
   * 만료된 견적이라도 돈이 들어왔으면 확인을 허용한다 — 문의가 QUOTED가 아니면 markPaid가 불일치로 관리자에게 알린다.
   */
  async confirmBankTransfer(paymentId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 동시 클릭·웹훅과의 경쟁을 행 잠금으로 직렬화 — applyRemote는 조건부 updateMany로 경쟁을 막지만, 여기는 상태를 읽고 분기하므로 행 잠금이 필요하다
      const [row] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      if (!row) throw new NotFoundException('Payment not found');
      const local = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          paidAt: true,
          quote: {
            select: { requestId: true, request: { select: { userId: true } } },
          },
        },
      });
      if (local.provider !== PaymentProvider.BANK_TRANSFER) {
        throw new ConflictException('NOT_BANK_TRANSFER');
      }
      if (
        local.status !== PaymentStatus.PENDING &&
        local.status !== PaymentStatus.PAID
      ) {
        throw new ConflictException('NOT_PENDING');
      }
      // 감사 로그를 markPaid보다 먼저 — 전이와 같은 트랜잭션(기록 없는 입금 확인이 존재할 수 없게)이면서,
      // markPaid가 관리자 메일을 setImmediate로 예약하므로 그 뒤에는 실패할 수 있는 쓰기를 두지 않는다
      // (뒤에서 실패해 롤백되면 확정되지 않은 입금의 메일이 나간다).
      // 행을 잠근 채 PENDING을 확인했으므로 markPaid의 결과는 'paid'로 결정돼 있다. PAID(재클릭)는 감사 없이 noop
      if (local.status === PaymentStatus.PENDING) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: 'BANK_TRANSFER_CONFIRMED',
            targetType: 'PAYMENT',
            targetId: local.id,
            detail: {
              requestId: local.quote.requestId,
              amount: local.amount.toString(),
              currency: local.currency,
            },
          },
        });
      }
      const outcome = await this.markPaid(tx, local, { paidAt: new Date() });
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { id: true, status: true, paidAt: true },
      });
      return { outcome, payment };
    });
  }

  /**
   * 관리자의 계좌이체 환불 기록 — 실제 송금은 은행에서 먼저 하고 여기서는 결과만 반영한다.
   * PortOne 환불 웹훅(applyRemote)과 같은 전이(markRefunded)를 쓴다 — 두 경로의 REFUNDED는 같은 의미여야 한다.
   * 멱등: 이미 REFUNDED면 noop
   */
  async refundBankTransfer(paymentId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      // confirmBankTransfer와 같은 이유로 행 잠금 — 상태를 읽고 분기한다
      const [row] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      if (!row) throw new NotFoundException('Payment not found');
      const local = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          quote: {
            select: { requestId: true, request: { select: { userId: true } } },
          },
        },
      });
      if (local.provider !== PaymentProvider.BANK_TRANSFER) {
        throw new ConflictException('NOT_BANK_TRANSFER');
      }
      if (
        local.status !== PaymentStatus.PAID &&
        local.status !== PaymentStatus.REFUNDED
      ) {
        throw new ConflictException('NOT_PAID');
      }
      // 감사 로그를 전이보다 먼저, 같은 트랜잭션 — 기록 없는 환불이 존재할 수 없게. REFUNDED(재클릭)는 감사 없이 noop
      if (local.status === PaymentStatus.PAID) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: 'BANK_TRANSFER_REFUNDED',
            targetType: 'PAYMENT',
            targetId: local.id,
            detail: {
              requestId: local.quote.requestId,
              amount: local.amount.toString(),
              currency: local.currency,
            },
          },
        });
      }
      const outcome = await this.markRefunded(tx, local);
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: { id: true, status: true, paidAt: true },
      });
      return { outcome, payment };
    });
  }

  /**
   * PAID → REFUNDED 전이 + 문의 PAID·IN_PROGRESS → REFUNDED + 사용자 알림.
   * PortOne 환불 웹훅(applyRemote)과 관리자 계좌이체 환불 기록(refundBankTransfer)이 공유한다.
   * COMPLETED 문의는 결제만 REFUNDED로 바뀌고 문의 상태는 유지한다 (완료된 작업의 기록)
   */
  private async markRefunded(
    tx: Prisma.TransactionClient,
    local: PaidTarget,
  ): Promise<'refunded' | 'noop'> {
    const requestId = local.quote.requestId;
    const { count } = await tx.payment.updateMany({
      where: { id: local.id, status: PaymentStatus.PAID },
      data: { status: PaymentStatus.REFUNDED },
    });
    if (count === 0) return 'noop'; // 이미 REFUNDED (웹훅 중복·재클릭) 또는 PAID가 아님

    await tx.quoteRequest.updateMany({
      where: {
        id: requestId,
        status: { in: [RequestStatus.PAID, RequestStatus.IN_PROGRESS] },
      },
      data: { status: RequestStatus.REFUNDED },
    });
    const notice = await this.notifications.notifyPaymentRefunded(tx, {
      requestId,
      ownerId: local.quote.request.userId,
    });
    // 푸시는 커밋 뒤에 — 롤백된 환불의 푸시가 나가면 안 된다 (markPaid와 동일)
    this.enqueueAfterCommit(() => {
      this.notifications.enqueueUserPush({
        type: 'USER_PUSH',
        userId: local.quote.request.userId,
        requestId,
        ...notice,
      });
    });
    return 'refunded';
  }

  /**
   * PENDING → PAID 전이 + 문의 QUOTED → PAID + 사용자 알림 + 관리자 메일.
   * PayPal 웹훅/확인(applyRemote)과 관리자 입금 확인(confirmBankTransfer)이 공유한다 — 두 경로의 PAID는 같은 의미여야 한다.
   */
  private async markPaid(
    tx: Prisma.TransactionClient,
    local: PaidTarget,
    paid: { paidAt: Date; portoneTxId?: string },
  ): Promise<'paid' | 'noop'> {
    const requestId = local.quote.requestId;
    const { count } = await tx.payment.updateMany({
      where: { id: local.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.PAID,
        paidAt: paid.paidAt,
        portoneTxId: paid.portoneTxId,
        failReason: null,
      },
    });
    if (count === 0) return 'noop'; // 이미 PAID (웹훅과 confirm 경쟁, 또는 입금 확인 재클릭)

    const moved = await tx.quoteRequest.updateMany({
      where: { id: requestId, status: RequestStatus.QUOTED },
      data: { status: RequestStatus.PAID },
    });
    if (moved.count === 0) {
      // 결제 중 사용자가 문의를 취소한 경우 등 — 돈은 받았으니 관리자가 환불/복구 판단
      this.metrics.paymentMismatch('request_status');
      this.logger.error(
        `결제는 PAID인데 문의 #${requestId}가 QUOTED가 아님 — 수동 확인 필요`,
      );
      await this.notifications.notifyAdminsPaymentMismatch(tx, {
        requestId,
        paymentId: local.id,
        reason: 'request not in QUOTED status at payment time',
      });
    }
    const notice = await this.notifications.notifyPaymentPaid(tx, {
      requestId,
      ownerId: local.quote.request.userId,
      amount: local.amount.toString(),
      currency: local.currency,
    });
    // 이메일은 커밋 이후 큐로 — tx 안에서 등록하면 롤백된 결제의 메일이 나갈 수 있다
    this.enqueueAfterCommit(() => {
      this.notifications.enqueueAdminEmail({
        type: 'ADMIN_PAYMENT_PAID_EMAIL',
        requestId,
        amount: local.amount.toString(),
        currency: local.currency,
        provider: local.provider,
      });
      this.notifications.enqueueUserPush({
        type: 'USER_PUSH',
        userId: local.quote.request.userId,
        requestId,
        ...notice,
      });
    });
    return 'paid';
  }

  /**
   * PortOne 조회 결과를 우리 상태로 반영하는 유일한 전이 함수.
   * 상태 조건을 updateMany의 where에 넣어 동시 호출(웹훅+confirm)에도 한 번만 전이된다.
   */
  private async applyRemote(
    tx: Prisma.TransactionClient,
    remote: PortOnePayment,
  ): Promise<SyncOutcome> {
    if (!('id' in remote)) return 'noop';
    const local = await tx.payment.findUnique({
      where: { id: remote.id },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        quote: {
          select: { requestId: true, request: { select: { userId: true } } },
        },
      },
    });
    if (!local) return 'unknown_payment';
    const requestId = local.quote.requestId;

    switch (remote.status) {
      case 'PAID': {
        const expected = toMinorUnits(local.amount, local.currency);
        const mismatch =
          remote.amount.total !== expected
            ? `amount ${remote.amount.total} != expected ${expected}`
            : remote.currency !== local.currency
              ? `currency ${remote.currency} != expected ${local.currency}`
              : null;
        if (mismatch) {
          // 돈은 들어왔지만 우리가 청구한 것과 다르다 — 상태를 바꾸지 않고 사람에게 넘긴다
          this.metrics.paymentMismatch(
            remote.amount.total !== expected ? 'amount' : 'currency',
          );
          this.logger.error(`결제 불일치 payment=${local.id}: ${mismatch}`);
          Sentry.captureMessage('payment amount mismatch', {
            level: 'error',
            extra: { paymentId: local.id, mismatch },
          });
          await tx.payment.updateMany({
            where: { id: local.id, status: PaymentStatus.PENDING },
            data: {
              failReason: `MISMATCH: ${mismatch}`,
              portoneTxId: remote.transactionId,
            },
          });
          await this.notifications.notifyAdminsPaymentMismatch(tx, {
            requestId,
            paymentId: local.id,
            reason: mismatch,
          });
          return 'mismatch';
        }

        return this.markPaid(tx, local, {
          paidAt: new Date(remote.paidAt),
          portoneTxId: remote.transactionId,
        });
      }

      case 'FAILED': {
        const reason = [remote.failure.pgCode, remote.failure.reason]
          .filter(Boolean)
          .join(': ')
          .slice(0, 200);
        const { count } = await tx.payment.updateMany({
          where: { id: local.id, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.FAILED,
            failReason: reason || 'FAILED',
            portoneTxId: remote.transactionId,
          },
        });
        return count > 0 ? 'failed' : 'noop';
      }

      case 'CANCELLED':
      case 'PARTIAL_CANCELLED': {
        // 취소/환불은 PortOne 콘솔(관리자)에서 실행된다 — 여기서는 결과만 반영
        if ((await this.markRefunded(tx, local)) === 'refunded') {
          return 'refunded';
        }
        // PENDING도 환불 대상: 금액 불일치로 멈춘 결제, PAID 웹훅을 놓친 결제 (failReason은 감사용으로 유지).
        // 문의는 건드리지 않는다 — 이 결제로 PAID가 된 적이 없고, 재시도 결제로 이미 PAID일 수 있다
        const pending = await tx.payment.updateMany({
          where: { id: local.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.REFUNDED },
        });
        return pending.count > 0 ? 'refunded' : 'noop';
      }

      default:
        return 'noop'; // READY / PAY_PENDING / VIRTUAL_ACCOUNT_ISSUED / 미인식 — 확정 아님
    }
  }

  /**
   * 트랜잭션 커밋 직후 실행할 부수효과. Prisma 대화형 트랜잭션에는 커밋 훅이 없어
   * 다음 틱으로 미룬다 — 롤백된 경우엔 applyRemote가 throw해서 여기까지 오지 않는다.
   */
  private enqueueAfterCommit(fn: () => void) {
    setImmediate(fn);
  }
}

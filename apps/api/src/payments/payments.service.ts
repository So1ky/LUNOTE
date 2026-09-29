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
import { PrismaService } from '../prisma/prisma.service';
import { toMinorUnits } from './currency';
import {
  PortOneGateway,
  type PortOnePayment,
  type PortOneWebhookEvent,
} from './portone.gateway';

/** 통화 → 결제 채널 라우팅. 국내 PG(KRW) 추가 시 여기에 한 줄 (앱은 provider로 UI를 분기) */
const PROVIDER_BY_CURRENCY: Record<string, PaymentProvider> = {
  USD: PaymentProvider.PAYPAL,
};

/** 앱이 결제 UI를 띄우는 데 필요한 값 — 시크릿은 절대 포함하지 않는다 (storeId/channelKey는 공개 식별자) */
export type PaymentIntent = {
  paymentId: string;
  provider: PaymentProvider;
  storeId: string;
  channelKey: string;
  orderName: string;
  /** PortOne totalAmount — 통화 최소 단위 정수 (USD 센트) */
  totalAmount: number;
  currency: string;
  /** 표시용 원 금액 (Decimal 문자열) */
  amount: string;
};

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

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly portone: PortOneGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * 결제 의도 생성: 견적 검증(소유·상태·만료) 후 PENDING Payment 행을 만들고
   * 앱이 결제 UI를 띄울 값을 돌려준다. 금액은 서버의 Quote에서만 온다.
   */
  async createIntent(userId: string, quoteId: string): Promise<PaymentIntent> {
    if (!this.portone.isConfigured) {
      throw new ServiceUnavailableException('PAYMENTS_NOT_CONFIGURED');
    }
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

    // 미완료 시도가 있으면 재사용 — PortOne은 미결제 paymentId 재요청을 허용하고, 행 남발을 막는다
    const existing = await this.prisma.payment.findFirst({
      where: { quoteId: quote.id, status: PaymentStatus.PENDING, provider },
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
        },
        select: { id: true },
      }));

    return {
      paymentId: payment.id,
      provider,
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

        const { count } = await tx.payment.updateMany({
          where: { id: local.id, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(remote.paidAt),
            portoneTxId: remote.transactionId,
            failReason: null,
          },
        });
        if (count === 0) return 'noop'; // 이미 PAID (웹훅과 confirm 경쟁)

        const moved = await tx.quoteRequest.updateMany({
          where: { id: requestId, status: RequestStatus.QUOTED },
          data: { status: RequestStatus.PAID },
        });
        if (moved.count === 0) {
          // 결제 중 사용자가 문의를 취소한 경우 등 — 돈은 받았으니 관리자가 환불/복구 판단
          this.logger.error(
            `결제는 PAID인데 문의 #${requestId}가 QUOTED가 아님 — 수동 확인 필요`,
          );
          await this.notifications.notifyAdminsPaymentMismatch(tx, {
            requestId,
            paymentId: local.id,
            reason: 'request not in QUOTED status at payment time',
          });
        }
        await this.notifications.notifyPaymentPaid(tx, {
          requestId,
          ownerId: local.quote.request.userId,
          amount: local.amount.toString(),
          currency: local.currency,
        });
        // 이메일은 커밋 이후 큐로 — tx 안에서 등록하면 롤백된 결제의 메일이 나갈 수 있다
        this.enqueueAfterCommit(() =>
          this.notifications.enqueueAdminEmail({
            type: 'ADMIN_PAYMENT_PAID_EMAIL',
            requestId,
            amount: local.amount.toString(),
            currency: local.currency,
            provider: local.provider,
          }),
        );
        return 'paid';
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
        const { count } = await tx.payment.updateMany({
          where: { id: local.id, status: PaymentStatus.PAID },
          data: { status: PaymentStatus.REFUNDED },
        });
        if (count === 0) return 'noop';
        await tx.quoteRequest.updateMany({
          where: {
            id: requestId,
            status: { in: [RequestStatus.PAID, RequestStatus.IN_PROGRESS] },
          },
          data: { status: RequestStatus.REFUNDED },
        });
        return 'refunded';
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

import { Injectable } from '@nestjs/common';
import { metrics, type Counter, type Meter } from '@opentelemetry/api';

const PAYMENT_MISMATCH_REASONS = [
  'amount',
  'currency',
  'request_status',
] as const;
const WEBHOOK_FAILURE_REASONS = [
  'signature',
  'missing_id',
  'unknown_payment',
  'exception',
] as const;
const ACCOUNT_DELETION_RESULTS = ['deleted', 'blocked'] as const;
export type PaymentMismatchReason = (typeof PAYMENT_MISMATCH_REASONS)[number];
export type WebhookFailureReason = (typeof WEBHOOK_FAILURE_REASONS)[number];
export type AccountDeletionResult = (typeof ACCOUNT_DELETION_RESULTS)[number];

/**
 * 비즈니스 카운터의 단일 정의처. 결제·웹훅 코드에는 메서드 호출 한 줄만 들어간다.
 * OTel 카운터 이름에 Prometheus exporter가 `_total`을 붙인다 (lunote_payment_mismatch → lunote_payment_mismatch_total).
 * SDK가 꺼져 있으면(OTEL_SDK_DISABLED, 테스트) 전역 meter는 no-op — 호출은 안전하다.
 */
@Injectable()
export class MetricsService {
  private readonly paymentMismatchCounter: Counter;
  private readonly webhookFailureCounter: Counter;
  private readonly accountDeletionCounter: Counter;
  private readonly accountCleanupFailureCounter: Counter;

  constructor(meter: Meter = metrics.getMeter('lunote-api')) {
    this.paymentMismatchCounter = meter.createCounter(
      'lunote_payment_mismatch',
      {
        description:
          'PortOne 조회 금액·통화가 청구와 다르거나 문의 상태가 맞지 않은 결제 수',
      },
    );
    this.webhookFailureCounter = meter.createCounter(
      'lunote_portone_webhook_failures',
      { description: '처리하지 못한 PortOne 웹훅 수(사유별)' },
    );
    this.accountDeletionCounter = meter.createCounter(
      'lunote_account_deletions',
      { description: '계정 삭제 요청 결과 수(삭제 완료·진행 중 결제로 차단)' },
    );
    this.accountCleanupFailureCounter = meter.createCounter(
      'lunote_account_cleanup_failures',
      {
        description:
          '재시도를 모두 소진한 탈퇴 사용자 파일 삭제 잡 수 — 개인정보 파일 잔존',
      },
    );
    // 사유별 0을 미리 노출 — 시계열이 첫 발생 때 생기면 increase()가 그 첫 1건을 놓친다
    for (const reason of PAYMENT_MISMATCH_REASONS) {
      this.paymentMismatchCounter.add(0, { reason });
    }
    for (const reason of WEBHOOK_FAILURE_REASONS) {
      this.webhookFailureCounter.add(0, { reason });
    }
    for (const result of ACCOUNT_DELETION_RESULTS) {
      this.accountDeletionCounter.add(0, { result });
    }
    this.accountCleanupFailureCounter.add(0);
  }

  paymentMismatch(reason: PaymentMismatchReason): void {
    this.paymentMismatchCounter.add(1, { reason });
  }

  webhookFailure(reason: WebhookFailureReason): void {
    this.webhookFailureCounter.add(1, { reason });
  }

  accountDeletion(result: AccountDeletionResult): void {
    this.accountDeletionCounter.add(1, { result });
  }

  accountCleanupFailure(): void {
    this.accountCleanupFailureCounter.add(1);
  }
}

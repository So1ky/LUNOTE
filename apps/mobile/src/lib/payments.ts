import { api } from './api';

/** 서버 PaymentsService.createIntent 응답 — 결제 UI를 띄우는 데 필요한 공개값만 온다 */
export type PaymentIntent = {
  paymentId: string;
  provider: 'PAYPAL';
  storeId: string;
  channelKey: string;
  orderName: string;
  /** PortOne totalAmount — 통화 최소 단위 정수 (USD 센트) */
  totalAmount: number;
  currency: string;
  /** 표시용 원 금액 (Decimal 문자열) */
  amount: string;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type Payment = {
  id: string;
  quoteId: string;
  provider: 'PAYPAL';
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  quote: { requestId: number };
};

export function createPaymentIntent(token: string, quoteId: string) {
  return api<PaymentIntent>('/payments', {
    method: 'POST',
    body: { quoteId },
    token,
  });
}

export function getPayment(token: string, paymentId: string) {
  return api<Payment>(`/payments/${paymentId}`, { token });
}

/** 결제 UI 완료 콜백 후 호출 — 서버가 PortOne 조회 API로 재검증해 확정한다 */
export function confirmPayment(token: string, paymentId: string) {
  return api<Payment>(`/payments/${paymentId}/confirm`, {
    method: 'POST',
    token,
  });
}

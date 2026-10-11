import { api } from './api';

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

export type BankTransferIntent = {
  provider: 'BANK_TRANSFER';
  paymentId: string;
  amount: string;
  currency: string;
  bank: { name: string; accountNumber: string; holder: string };
  /** 입금자명 — 관리자가 입금 내역과 대조한다 */
  depositorName: string;
  /** 입금 기한(ISO) = 견적 만료 */
  deadline: string;
};

/** 서버 PaymentsService.createIntent 응답 — provider로 분기한다. 결제 UI를 띄우는 데 필요한 공개값만 온다 */
export type PaymentIntent = PayPalIntent | BankTransferIntent;

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type Payment = {
  id: string;
  quoteId: string;
  provider: 'PAYPAL' | 'BANK_TRANSFER';
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
    // 결제 화면의 청약철회 제한 동의 체크 후에만 호출된다 — 서버가 동의 시각을 기록
    body: { quoteId, withdrawalConsent: true },
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

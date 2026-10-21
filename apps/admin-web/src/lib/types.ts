/** 관리자 API 응답 타입 — apps/api/src/admin/admin-quote-requests.service.ts 의 SELECT와 일치 */

export type Category =
  | 'HOUSING'
  | 'VISA'
  | 'HOSPITAL'
  | 'BANK'
  | 'TELECOM'
  | 'OTHER';

export type RequestStatus =
  | 'REVIEWING'
  | 'QUOTED'
  | 'PAYMENT_RECEIVED'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REFUNDED';

export const CATEGORY_META: Record<Category, { emoji: string; label: string }> = {
  HOUSING: { emoji: '🏠', label: 'Housing' },
  VISA: { emoji: '🛂', label: 'Visa' },
  HOSPITAL: { emoji: '🏥', label: 'Hospital' },
  BANK: { emoji: '🏦', label: 'Bank' },
  TELECOM: { emoji: '📱', label: 'Telecom' },
  OTHER: { emoji: '✨', label: 'Other' },
};

export const STATUS_META: Record<RequestStatus, { label: string; color: string }> = {
  REVIEWING: { label: 'Reviewing', color: 'var(--warning)' },
  QUOTED: { label: 'Quote sent', color: 'var(--purple)' },
  PAYMENT_RECEIVED: { label: 'Confirming payment', color: 'var(--warning)' }, // PayPal 결제 검증됨, 관리자 확인 대기
  PAID: { label: 'Paid', color: 'var(--success)' },
  IN_PROGRESS: { label: 'In progress', color: 'var(--info)' },
  AWAITING_CONFIRMATION: { label: 'Awaiting confirmation', color: 'var(--purple)' }, // 완료 통지됨 — 고객 확인·5영업일 자동 완료 대기
  COMPLETED: { label: 'Completed', color: 'var(--text-muted)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--danger)' },
  REJECTED: { label: 'Rejected', color: 'var(--danger)' },
  REFUNDED: { label: 'Refunded', color: 'var(--text-muted)' },
};

/**
 * 관리자가 수동으로 옮길 수 있는 다음 상태 — 서버 REQUIRED_CURRENT와 동일(PAYMENT_RECEIVED → PAID → IN_PROGRESS → AWAITING_CONFIRMATION).
 * COMPLETED는 관리자가 만들지 않는다 — 고객 확인 또는 5영업일 경과 자동 완료 (약관 제6조)
 */
export const WORK_TRANSITIONS: Partial<
  Record<
    RequestStatus,
    {
      to: 'PAID' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION';
      hint: string;
      buttonLabel: string;
      confirmTitle: string;
      doneMessage: string;
    }
  >
> = {
  // PayPal: PortOne 웹훅이 결제를 검증해 놓은 상태 — 관리자가 확인해야 PAID (계좌이체의 입금 확인과 같은 수동 단계)
  PAYMENT_RECEIVED: {
    to: 'PAID',
    hint: 'PayPal payment was verified by PortOne. Confirm it to mark the request as paid and notify the customer.',
    buttonLabel: 'Confirm payment',
    confirmTitle: 'Confirm this PayPal payment?',
    doneMessage: 'Payment confirmed',
  },
  PAID: {
    to: 'IN_PROGRESS',
    hint: 'Payment is confirmed. Mark the request as in progress once you start working on it.',
    buttonLabel: 'Start work',
    confirmTitle: 'Start work on this request?',
    doneMessage: 'Request is now in progress',
  },
  IN_PROGRESS: {
    to: 'AWAITING_CONFIRMATION',
    hint: 'Once everything has been delivered, notify the customer. They have 5 business days to confirm or dispute; with no response the request completes automatically.',
    buttonLabel: 'Notify completion',
    confirmTitle: 'Notify the customer that the service is complete?',
    doneMessage: 'Completion notice sent',
  },
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  language: string | null;
};

/** 고객 표시 이름 — 실명(성+이름)이 없으면 이메일 */
export const customerName = (u: AdminUser) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;

export type PaymentMethod = 'PAYPAL' | 'BANK_TRANSFER';
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PAYPAL: 'PayPal (USD)',
  BANK_TRANSFER: 'Bank transfer (KRW)',
};
/** 결제수단이 견적 통화를 정한다 — 서버 규칙과 동일 */
export const CURRENCY_BY_METHOD: Record<PaymentMethod, 'USD' | 'KRW'> = {
  PAYPAL: 'USD',
  BANK_TRANSFER: 'KRW',
};

export type AdminPayment = {
  id: string;
  provider: PaymentMethod;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  amount: string;
  currency: string;
  paidAt: string | null;
  createdAt: string;
};

export type Quote = {
  id: string;
  amount: string;
  currency: string;
  explanation: string;
  expiresAt: string; // 발행 + 7일 — 만료 시 결제 불가
  createdAt: string;
  updatedAt: string;
  payments?: AdminPayment[]; // 관리자 상세에서만
};

export type Attachment = {
  id: string;
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};

export type AdminQuoteRequest = {
  id: number;
  category: Category;
  serviceItem: string | null; // 정형 서비스 항목 (예: HOUSING_1) — 구버전 요청은 null
  desiredAmount: string | null;
  currency: string;
  description: string;
  contactMethod: string;
  paymentMethod: PaymentMethod;
  status: RequestStatus;
  rejectionReason: string | null; // REJECTED일 때만 — 고객에게도 그대로 보인다
  completionNoticedAt: string | null; // AWAITING_CONFIRMATION 통지 시각
  confirmationDeadlineAt: string | null; // 통지 + 5영업일 — 지나면 자동 COMPLETED
  disputeReason: string | null; // 고객 이의제기 사유 — IN_PROGRESS 복귀 시 저장
  disputedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: AdminUser;
  quote: Quote | null;
};

export type AdminQuoteRequestDetail = AdminQuoteRequest & {
  attachments: Attachment[];
};

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatAmount = (amount: string | number, currency: string) =>
  currency === 'USD'
    ? `$${Number(amount).toLocaleString()}`
    : currency === 'KRW'
      ? `₩${Number(amount).toLocaleString()}`
      : `${currency} ${Number(amount).toLocaleString()}`;

/** 앱의 SERVICE_CATALOG(serviceItem)와 동일 키의 영어 제목 — 어드민은 영어 고정 */
export const SERVICE_LABELS: Record<string, string> = {
  HOUSING_1: 'Housing Search & Area Guide',
  HOUSING_2: 'Real Estate Communication Support',
  HOUSING_3: 'Property Viewing Interpretation & Accompaniment',
  HOUSING_4: 'Move-in & Utility Setup Support',
  HOUSING_5: 'Other Housing Request',
  VISA_1: 'Visa Information & Checklist',
  VISA_2: 'Immigration Website & Appointment Support',
  VISA_3: 'Document Organization & Language Support',
  VISA_4: 'Immigration Office Accompaniment',
  VISA_5: 'Other Visa Request',
  HOSPITAL_1: 'Korea Healthcare Navigation',
  HOSPITAL_2: 'Hospital Communication Support',
  HOSPITAL_3: 'Hospital Visit Interpretation & Accompaniment',
  HOSPITAL_4: 'Medical Document & Interpreter Coordination',
  HOSPITAL_5: 'Other Healthcare Request',
  BANK_1: 'Bank Account Opening Guide',
  BANK_2: 'Banking App & Authentication Support',
  BANK_3: 'Bank Visit Interpretation & Accompaniment',
  BANK_4: 'International Transfer Process Support',
  BANK_5: 'Other Banking Request',
  TELECOM_1: 'SIM / eSIM & Mobile Plan Guide',
  TELECOM_2: 'Mobile Service Setup Support',
  TELECOM_3: 'Home Internet Setup Support',
  TELECOM_4: 'Telecom Customer Service Support',
  TELECOM_5: 'Other Mobile & Internet Request',
  OTHER_1: 'Government Office Navigation',
  OTHER_2: 'Korean Phone Call & Communication Support',
  OTHER_3: 'School & Childcare Information Support',
  OTHER_4: 'Korea Life Concierge',
  OTHER_5: 'Other Request',
};

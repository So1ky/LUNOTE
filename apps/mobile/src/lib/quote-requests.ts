import { api } from './api';
import type { Attachment, AttachmentInput } from './attachments';

/** 백엔드 QuoteRequest 응답 (apps/api REQUEST_SELECT와 동일 형태) */
export type RequestStatus =
  | 'REVIEWING'
  | 'QUOTED'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type Category =
  | 'HOUSING'
  | 'VISA'
  | 'HOSPITAL'
  | 'BANK'
  | 'TELECOM'
  | 'OTHER';

export type Quote = {
  id: string;
  amount: string; // Prisma Decimal은 JSON에서 문자열
  currency: string;
  explanation: string;
  expiresAt: string; // 발행+7일 — 만료 시 결제 불가 (서버가 강제, UI는 표시만)
  createdAt: string;
};

export type QuoteRequest = {
  id: number;
  category: Category;
  desiredAmount: string | null;
  currency: string;
  description: string;
  contactMethod: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  quote: Quote | null;
  /** 상세 조회에서만 포함된다 */
  attachments?: Attachment[];
};

export type CreateQuoteRequestInput = {
  category: Category;
  desiredAmount?: number;
  description: string;
  contactMethod: string;
  attachments?: AttachmentInput[];
};

export function listQuoteRequests(token: string) {
  return api<QuoteRequest[]>('/quote-requests', { token });
}

export function getQuoteRequest(token: string, id: number) {
  return api<QuoteRequest>(`/quote-requests/${id}`, { token });
}

export function createQuoteRequest(
  token: string,
  input: CreateQuoteRequestInput,
) {
  return api<QuoteRequest>('/quote-requests', {
    method: 'POST',
    body: input,
    token,
  });
}

export function cancelQuoteRequest(token: string, id: number) {
  return api<QuoteRequest>(`/quote-requests/${id}/cancel`, {
    method: 'PATCH',
    token,
  });
}

/** 카테고리 라벨은 i18n(categories.<Category>)에서 온다 — 여기는 이모지만 */
export const CATEGORY_META: Record<Category, { emoji: string }> =
  {
    HOUSING: { emoji: '🏠' },
    VISA: { emoji: '🛂' },
    HOSPITAL: { emoji: '🏥' },
    BANK: { emoji: '🏦' },
    TELECOM: { emoji: '📱' },
    OTHER: { emoji: '✨' },
  };

/** locale는 활성 언어(useTranslation().locale) — 미지정 시 en 폴백 */
export function formatDate(iso: string, locale = 'en') {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAmount(
  amount: string | null,
  currency: string,
  locale = 'en',
) {
  if (amount === null) return null;
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString(locale)}`;
}

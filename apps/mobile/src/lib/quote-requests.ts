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

export const CATEGORY_META: Record<Category, { emoji: string; label: string }> =
  {
    HOUSING: { emoji: '🏠', label: 'Housing' },
    VISA: { emoji: '🛂', label: 'Visa' },
    HOSPITAL: { emoji: '🏥', label: 'Hospital' },
    BANK: { emoji: '🏦', label: 'Bank' },
    TELECOM: { emoji: '📱', label: 'Telecom' },
    OTHER: { emoji: '✨', label: 'Other' },
  };

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatAmount(amount: string | null, currency: string) {
  if (amount === null) return null;
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString()}`;
}

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
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
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
  PAID: { label: 'Paid', color: 'var(--success)' },
  IN_PROGRESS: { label: 'In progress', color: 'var(--info)' },
  COMPLETED: { label: 'Completed', color: 'var(--text-muted)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--danger)' },
  REFUNDED: { label: 'Refunded', color: 'var(--text-muted)' },
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

export type Quote = {
  id: string;
  amount: string;
  currency: string;
  explanation: string;
  expiresAt: string; // 발행 + 7일 — 만료 시 결제 불가
  createdAt: string;
  updatedAt: string;
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
  desiredAmount: string | null;
  currency: string;
  description: string;
  contactMethod: string;
  status: RequestStatus;
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
  `${currency === 'USD' ? '$' : `${currency} `}${Number(amount).toLocaleString()}`;

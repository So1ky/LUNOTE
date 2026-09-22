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
  serviceItem: string | null; // 정형 서비스 항목 (예: HOUSING_1) — 구버전 요청은 null
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

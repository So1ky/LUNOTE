import type { Category } from './quote-requests';

/** 카테고리별 정형 서비스 항목 ID — 서버 QuoteRequest.serviceItem과 동일 형식 */
export type ServiceItemId = `${Category}_${1 | 2 | 3 | 4 | 5}`;

export type ServiceItem = {
  id: ServiceItemId;
  /** 시작가(USD). null이면 Custom Quote — 라벨·설명은 i18n(services.<id>)에서 온다 */
  startingPriceUsd: number | null;
};

// 기획 확정 가격표 (2026-09) — 각 카테고리 5번 항목은 Custom Quote
const STARTING_PRICES_USD: Record<Category, [number | null, number | null, number | null, number | null, number | null]> = {
  HOUSING: [35, 35, 60, 60, null],
  VISA: [20, 30, 35, 60, null],
  HOSPITAL: [20, 30, 60, 35, null],
  BANK: [20, 30, 60, 35, null],
  TELECOM: [20, 30, 30, 35, null],
  OTHER: [35, 20, 35, 35, null],
};

export const SERVICE_CATALOG = Object.fromEntries(
  (Object.keys(STARTING_PRICES_USD) as Category[]).map((category) => [
    category,
    STARTING_PRICES_USD[category].map((price, i) => ({
      id: `${category}_${i + 1}` as ServiceItemId,
      startingPriceUsd: price,
    })),
  ]),
) as Record<Category, ServiceItem[]>;

/** Custom Quote(주관식 예산 입력이 허용되는) 항목인지 */
export function isCustomQuoteItem(id: ServiceItemId) {
  return id.endsWith('_5');
}

/** `$35~` 형태의 시작가 표기. Custom Quote는 null — 호출부에서 i18n 라벨로 대체 */
export function formatStartingPrice(priceUsd: number | null) {
  return priceUsd === null ? null : `$${priceUsd}~`;
}

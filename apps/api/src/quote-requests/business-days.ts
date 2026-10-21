/** 완료 통지 후 고객이 확인·이의제기할 수 있는 기간 (약관 제6조) */
export const CONFIRMATION_BUSINESS_DAYS = 5;

/**
 * 영업일 더하기 — 토·일만 제외한다 (공휴일 테이블 없음, 약관에 "월~금" 명시).
 * 시각은 유지한다: 통지 시각 + n영업일이 그대로 기한이 된다. UTC 요일 기준.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return result;
}

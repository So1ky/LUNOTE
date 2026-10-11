import { Prisma } from '@prisma/client';

/**
 * PortOne V2는 금액을 통화의 최소 단위(minor unit) 정수로 받는다 (USD 6.00 → 600, KRW 1000 → 1000).
 * ISO 4217 소수 자릿수 — 여기 없는 통화는 2로 취급한다.
 */
const MINOR_UNIT_DIGITS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  KRW: 0,
  JPY: 0,
};

export function minorUnitDigits(currency: string): number {
  return MINOR_UNIT_DIGITS[currency] ?? 2;
}

/** Decimal(12,2) 금액 → PortOne totalAmount 정수. 반올림 오차 없이 정수 산술로 변환한다. */
export function toMinorUnits(
  amount: Prisma.Decimal | string,
  currency: string,
): number {
  const digits = minorUnitDigits(currency);
  const scaled = new Prisma.Decimal(amount).mul(10 ** digits);
  if (!scaled.isInteger()) {
    // 견적 금액이 통화 최소 단위보다 잘게 쪼개져 있으면 결제 불가 (예: KRW 100.5)
    throw new Error(
      `Amount ${String(amount)} is not representable in ${currency}`,
    );
  }
  return scaled.toNumber();
}

/**
 * 사용자에게 가는 인앱·푸시 알림 문구 — 수신자의 프로필 언어(User.language)로 고른다.
 * 제목만 쓴다(2026-10-11 결정). 관리자용 알림은 영어 고정이라 여기 없다.
 * 앱의 i18n 카탈로그(apps/mobile/src/i18n)와 별개 — 서버는 OS 푸시 본문을 만들어야 하므로 자체 사본을 둔다.
 */
export type UserNoticeKind = 'QUOTE_SENT' | 'PAYMENT_PAID';

const FALLBACK = 'en';

const TITLES: Record<UserNoticeKind, Record<string, string>> = {
  QUOTE_SENT: {
    ko: '견적이 도착했어요',
    en: 'Your quote is ready',
    ja: 'お見積りが届きました',
    zh: '您的报价已准备好',
    de: 'Ihr Angebot ist da',
    es: 'Tu presupuesto está listo',
  },
  PAYMENT_PAID: {
    ko: '결제가 확인됐어요',
    en: 'Payment received',
    ja: 'お支払いを確認しました',
    zh: '已收到付款',
    de: 'Zahlung eingegangen',
    es: 'Pago recibido',
  },
};

/** 언어가 없거나 목록에 없으면 영어 */
export function userNoticeTitle(
  kind: UserNoticeKind,
  language: string | null | undefined,
): string {
  const titles = TITLES[kind];
  return (language && titles[language]) || titles[FALLBACK];
}

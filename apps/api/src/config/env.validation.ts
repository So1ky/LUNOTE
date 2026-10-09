/**
 * 환경변수 검증 + 기본값의 단일 정의처.
 * - 프로덕션: 인프라 연결값이 하나라도 없으면 기동 실패 (fail-fast — 반쯤 죽은 채 뜨지 않는다)
 * - 개발: 로컬 기본값을 여기서만 채운다. 서비스 코드에는 하드코딩 폴백을 두지 않는다.
 */

/** 어디서나 항상 있어야 하는 값 */
const ALWAYS_REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'S3_BUCKET',
  'S3_REGION',
];

/** PortOne 연동값 — 시크릿 2개 + 공개 식별자 2개 (storeId/channelKey는 앱에 내려가는 공개값) */
export const PORTONE_ENV_KEYS = [
  'PORTONE_API_SECRET',
  'PORTONE_WEBHOOK_SECRET',
  'PORTONE_STORE_ID',
  'PORTONE_PAYPAL_CHANNEL_KEY',
] as const;

/**
 * 소셜 로그인 — Web 클라이언트 ID·Team ID·Key ID는 공개 식별자(ConfigMap), .p8 개인키만 시크릿.
 * 로컬은 미설정 허용: 소셜 엔드포인트가 503으로 응답한다 (PortOne과 같은 방식).
 */
export const SOCIAL_ENV_KEYS = [
  'GOOGLE_WEB_CLIENT_ID',
  'APPLE_TEAM_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
] as const;

/** 프로덕션에서만 필수 (로컬은 아래 DEV_DEFAULTS로 대체) */
const PROD_REQUIRED = [
  'REDIS_URL',
  'CORS_ORIGINS',
  'SMTP_HOST',
  'HOST',
  // PortOne — 없으면 결제가 불가능한 채로 뜨므로 프로덕션은 기동 실패시킨다.
  // 로컬은 미설정 허용: PaymentsService가 503(PAYMENTS_NOT_CONFIGURED)으로 응답한다.
  ...PORTONE_ENV_KEYS,
  ...SOCIAL_ENV_KEYS,
];

/** 개발 편의 기본값 — 프로덕션에서는 PROD_REQUIRED가 우선이라 적용되지 않는 것 포함 */
const DEV_DEFAULTS: Record<string, string> = {
  REDIS_URL: 'redis://localhost:6379',
  HOST: '127.0.0.1', // 로컬 보안 기본값 — CLAUDE.md 로컬 개발 환경 참고
};

/** 정책 기본값 — 환경 무관 튜닝 가능값 (프로덕션에서 env로 덮어쓸 수 있다) */
const POLICY_DEFAULTS: Record<string, string> = {
  PORT: '3000', // 컨테이너 관례 기본값 — HOST와 달리 prod에서도 기본 허용
  LOG_LEVEL: 'info',
  // SENTRY_DSN은 선택값 — 미설정이면 Sentry 전체가 no-op (기본값 없음)
  MAIL_FROM: 'LUNOTE <noreply@lunote.app>',
  SMTP_PORT: '587',
  JWT_EXPIRES: '30m', // 액세스는 짧게 — 갱신은 refresh token으로 (ARCHITECTURE §11)
  REFRESH_TTL_DAYS: '30',
  AUTH_CODE_TTL_MIN: '15',
  QUOTE_VALIDITY_DAYS: '7', // 견적 유효기간 (제품 결정 2026-07-24)
  AUTH_CODE_MAX_ATTEMPTS: '5',
  AUTH_RESEND_COOLDOWN_SEC: '60',
  PRESIGN_UPLOAD_TTL_SEC: '300',
  PRESIGN_DOWNLOAD_TTL_SEC: '3600',
  // Apple identity token의 aud·client_secret의 sub — 번들 ID 확정값 (ARCHITECTURE §12)
  APPLE_BUNDLE_ID: 'com.lunoteapp',
  // 전역 rate limit — IP당 분당 요청 수. 부하 테스트 창에서만 prod 오버레이로 올린다 (Plan 9)
  THROTTLE_DEFAULT_LIMIT: '100',
};

export function validateEnv(config: Record<string, unknown>) {
  const isProd = config.NODE_ENV === 'production';

  for (const [key, value] of Object.entries(POLICY_DEFAULTS)) {
    config[key] ??= value;
  }
  if (!isProd) {
    for (const [key, value] of Object.entries(DEV_DEFAULTS)) {
      config[key] ??= value;
    }
  }

  const required = [...ALWAYS_REQUIRED, ...(isProd ? PROD_REQUIRED : [])];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `필수 환경변수 누락: ${missing.join(', ')} — .env(로컬) 또는 Secrets Manager(프로덕션)를 확인하세요`,
    );
  }

  // 보안 통제라 잘못된 값이 제한을 조용히 끄지 않게 기동을 막는다 — NaN과의 비교는 항상 false라 가드가 아무것도 막지 않는다
  const throttleLimit = Number(config.THROTTLE_DEFAULT_LIMIT);
  if (!Number.isInteger(throttleLimit) || throttleLimit < 1) {
    throw new Error(
      `THROTTLE_DEFAULT_LIMIT는 1 이상의 정수여야 합니다 (현재: ${String(config.THROTTLE_DEFAULT_LIMIT)})`,
    );
  }
  return config;
}

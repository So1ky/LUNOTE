/**
 * 환경변수 검증 + 기본값의 단일 정의처.
 * - 프로덕션: 인프라 연결값이 하나라도 없으면 기동 실패 (fail-fast — 반쯤 죽은 채 뜨지 않는다)
 * - 개발: 로컬 기본값을 여기서만 채운다. 서비스 코드에는 하드코딩 폴백을 두지 않는다.
 */

/** 어디서나 항상 있어야 하는 값 */
const ALWAYS_REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'S3_BUCKET', 'S3_REGION'];

/** 프로덕션에서만 필수 (로컬은 아래 DEV_DEFAULTS로 대체) */
const PROD_REQUIRED = ['REDIS_URL', 'CORS_ORIGINS', 'SMTP_HOST', 'HOST'];

/** 개발 편의 기본값 — 프로덕션에서는 PROD_REQUIRED가 우선이라 적용되지 않는 것 포함 */
const DEV_DEFAULTS: Record<string, string> = {
  REDIS_URL: 'redis://localhost:6379',
  HOST: '127.0.0.1', // 로컬 보안 기본값 — CLAUDE.md 로컬 개발 환경 참고
};

/** 정책 기본값 — 환경 무관 튜닝 가능값 (프로덕션에서 env로 덮어쓸 수 있다) */
const POLICY_DEFAULTS: Record<string, string> = {
  PORT: '3000', // 컨테이너 관례 기본값 — HOST와 달리 prod에서도 기본 허용
  MAIL_FROM: 'LUNOTE <noreply@lunote.app>',
  SMTP_PORT: '587',
  JWT_EXPIRES: '1d', // TODO(#운영준비 PR-4): refresh token 도입 시 30m으로 단축
  AUTH_CODE_TTL_MIN: '15',
  AUTH_CODE_MAX_ATTEMPTS: '5',
  AUTH_RESEND_COOLDOWN_SEC: '60',
  PRESIGN_UPLOAD_TTL_SEC: '300',
  PRESIGN_DOWNLOAD_TTL_SEC: '3600',
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
  return config;
}

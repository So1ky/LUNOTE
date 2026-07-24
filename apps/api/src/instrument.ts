import * as Sentry from '@sentry/nestjs';

/**
 * Sentry 초기화 — Nest 부트스트랩 전에 실행돼야 해서 main.ts 최상단에서 import한다.
 * DI(ConfigService)보다 먼저 실행되므로 예외적으로 process.env를 직접 읽는다.
 * SENTRY_DSN 미설정(로컬 기본)이면 초기화하지 않는다 — 전체가 no-op.
 */
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // 에러 수집이 목적 — 트레이싱은 낮은 샘플링으로 비용/노이즈 억제
    tracesSampleRate: 0.1,
  });
}

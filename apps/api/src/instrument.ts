import * as Sentry from '@sentry/nestjs';
import { config } from 'dotenv';
import { startOtel } from './observability/otel';

/**
 * 계측 진입점 — Nest 부트스트랩 전에 실행돼야 해서 main.ts 최상단에서 import한다.
 * DI(ConfigService)보다 먼저 실행되므로 예외적으로 process.env를 직접 읽는다.
 * ConfigModule의 .env 로드는 이보다 늦다 → 로컬 .env의 OTEL_SDK_DISABLED·SENTRY_DSN이 먹도록 여기서 먼저 읽는다.
 * 이미 있는 환경 변수는 덮어쓰지 않고, .env가 없는 K8s에서는 아무 일도 하지 않는다.
 *
 * 역할 분리(ARCHITECTURE §8): 메트릭·트레이스는 OpenTelemetry SDK가 소유하고, Sentry는 에러 보고만 한다.
 * Sentry 10.x는 내부가 OTel이라 둘 다 자동 계측하면 스팬이 이중으로 잡힌다 → skipOpenTelemetrySetup.
 */
config({ quiet: true });
startOtel();

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    skipOpenTelemetrySetup: true,
    // tracesSampleRate는 0이라도 지정하면 Sentry가 트레이싱을 켠 것으로 보고 Nest·Prisma 등
    // 자동 계측을 OTel에 또 등록한다(hasSpansEnabled는 != null 검사) — 아예 넣지 않는다
  });
}

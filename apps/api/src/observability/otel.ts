import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SentryContextManager } from '@sentry/nestjs';

/**
 * OpenTelemetry SDK. 메트릭은 Prometheus exporter(METRICS_PORT, 기본 9464 — ALB 경로 밖),
 * 트레이스는 환경 변수로 결정된다(OTEL_TRACES_EXPORTER=none|otlp, OTEL_EXPORTER_OTLP_ENDPOINT, 샘플러).
 * main.ts의 첫 import(instrument.ts)에서 호출된다 — DI 이전이라 예외적으로 process.env를 직접 읽는다.
 * OTEL_SDK_DISABLED=true(로컬·테스트)면 시작하지 않는다.
 */
export function startOtel(): NodeSDK | null {
  if (process.env.OTEL_SDK_DISABLED === 'true') return null;

  // 안정 HTTP 시맨틱 컨벤션(http_server_request_duration_seconds) — 알림 규칙이 이 이름을 전제한다
  process.env.OTEL_SEMCONV_STABILITY_OPT_IN ??= 'http';
  // 로그는 stdout → Alloy → Loki 경로. 비워 두면 SDK가 OTLP 로그 exporter를 기본으로 켠다
  process.env.OTEL_LOGS_EXPORTER ??= 'none';
  // 트레이스도 비워 두면 OTLP(localhost:4318) + 100% 샘플링이 기본 — 켜려면 오버레이에서 otlp를 명시한다
  process.env.OTEL_TRACES_EXPORTER ??= 'none';
  // 들어오는 traceparent를 따르지 않는다 — sampled 플래그로 parentbased 샘플링(20%)을 100%로 강제할 수 있고,
  // 나가는 호출(PortOne·S3)에 트레이스 헤더를 붙일 이유도 없다. 프로세스 간 전파는 쓰지 않는다
  process.env.OTEL_PROPAGATORS ??= 'none';

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'lunote-api',
    }),
    metricReaders: [
      new PrometheusExporter({
        port: Number(process.env.METRICS_PORT ?? 9464),
        // API 서버와 같은 바인딩 — K8s는 HOST=0.0.0.0, 로컬 기본은 루프백(env.validation.ts와 같은 기본값)
        host: process.env.HOST ?? '127.0.0.1',
      }),
    ],
    // Sentry는 에러만 맡지만(instrument.ts), 요청별 스코프 격리를 위해 자기 컨텍스트 매니저가 필요하다
    contextManager: new SentryContextManager(),
    instrumentations: [
      new HttpInstrumentation({
        // 헬스체크(분당 수십 회)와 Prometheus 긁기(이 SDK의 메트릭 서버도 http 계측 대상) — 스팬·메트릭 모두 제외
        ignoreIncomingRequestHook: (req) =>
          req.url === '/health' || req.url === '/metrics',
      }),
      // http_route 라벨(라우트 템플릿)은 Express 계측이 채운다 — Nest 계측은 컨트롤러 스팬만 만든다
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      // 명령 이름만 남긴다 — 기본 직렬화기는 EVAL* 인자를 전부 남기는데, BullMQ 잡 등록(EVALSHA) 인자가
      // 잡 데이터(관리자 알림의 userEmail)라 개인정보가 트레이스에 저장된다
      new IORedisInstrumentation({
        dbStatementSerializer: (cmdName) => cmdName,
      }),
      new PgInstrumentation(),
      new RuntimeNodeInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });
  sdk.start();
  // once: Nest(enableShutdownHooks)는 정리 후 자기 리스너를 지우고 SIGTERM을 다시 보내 기본 종료를 기대한다.
  // 여기 리스너가 남아 있으면 그 재전송이 종료로 이어지지 않아 Pod가 grace period까지 살아 있다
  process.once('SIGTERM', () => {
    void sdk.shutdown();
  });
  return sdk;
}

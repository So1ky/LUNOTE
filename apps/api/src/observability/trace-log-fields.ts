import {
  TraceFlags,
  isSpanContextValid,
  trace,
  type Span,
} from '@opentelemetry/api';

/**
 * pino mixin용 — 로그 한 줄에서 그 요청의 트레이스로 점프(Grafana derived field).
 * 트레이스 exporter가 none이면 tracer provider가 없어 계측이 무효 스팬(ID 전부 0)을 만든다 → 필드를 넣지 않는다.
 * 샘플링에서 빠진 요청(80%)도 넣지 않는다 — Tempo에 없어 링크가 늘 "not found"가 된다.
 * 같은 요청의 로그 줄끼리 묶는 것은 req.id가 한다(pino-http가 요청 안의 모든 로그에 req를 붙인다).
 */
export function traceLogFields(
  span: Span | undefined = trace.getActiveSpan(),
): { trace_id?: string; span_id?: string } {
  const ctx = span?.spanContext();
  return ctx &&
    isSpanContextValid(ctx) &&
    (ctx.traceFlags & TraceFlags.SAMPLED) !== 0
    ? { trace_id: ctx.traceId, span_id: ctx.spanId }
    : {};
}

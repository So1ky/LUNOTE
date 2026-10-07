import { isSpanContextValid, trace, type Span } from '@opentelemetry/api';

/**
 * pino mixin용 — 로그 한 줄에서 그 요청의 트레이스로 점프(Grafana derived field).
 * 트레이스 exporter가 none이면 tracer provider가 없어 계측이 무효 스팬(ID 전부 0)을 만든다 → 필드를 넣지 않는다.
 */
export function traceLogFields(
  span: Span | undefined = trace.getActiveSpan(),
): { trace_id?: string; span_id?: string } {
  const ctx = span?.spanContext();
  return ctx && isSpanContextValid(ctx)
    ? { trace_id: ctx.traceId, span_id: ctx.spanId }
    : {};
}

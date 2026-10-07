import { INVALID_SPAN_CONTEXT, TraceFlags, trace } from '@opentelemetry/api';
import { traceLogFields } from './trace-log-fields';

describe('traceLogFields', () => {
  it('스팬이 없으면 필드가 없다', () => {
    expect(traceLogFields(undefined)).toEqual({});
  });

  it('트레이스가 꺼져 만들어진 무효 스팬(전부 0)이면 필드가 없다', () => {
    expect(traceLogFields(trace.wrapSpanContext(INVALID_SPAN_CONTEXT))).toEqual(
      {},
    );
  });

  it('유효한 스팬이면 trace_id·span_id를 남긴다', () => {
    const span = trace.wrapSpanContext({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      traceFlags: TraceFlags.SAMPLED,
    });
    expect(traceLogFields(span)).toEqual({
      trace_id: '0af7651916cd43dd8448eb211c80319c',
      span_id: 'b7ad6b7169203331',
    });
  });
});

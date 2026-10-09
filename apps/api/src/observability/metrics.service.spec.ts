import {
  MeterProvider,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
  AggregationTemporality,
  type DataPoint,
} from '@opentelemetry/sdk-metrics';
import { MetricsService } from './metrics.service';

/** 전역 provider 대신 테스트 전용 MeterProvider에 기록하고, 플러시해 읽는다 */
async function collect(
  exporter: InMemoryMetricExporter,
  reader: PeriodicExportingMetricReader,
) {
  await reader.forceFlush();
  const points: Record<
    string,
    { value: number; attrs: Record<string, unknown> }[]
  > = {};
  for (const rm of exporter.getMetrics()) {
    for (const sm of rm.scopeMetrics) {
      for (const m of sm.metrics) {
        // 카운터만 기록하므로 데이터 포인트 값은 number
        const dps = m.dataPoints as DataPoint<number>[];
        points[m.descriptor.name] = dps.map((dp) => ({
          value: dp.value,
          attrs: dp.attributes,
        }));
      }
    }
  }
  return points;
}

describe('MetricsService', () => {
  let exporter: InMemoryMetricExporter;
  let reader: PeriodicExportingMetricReader;
  let service: MetricsService;

  beforeEach(() => {
    exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    reader = new PeriodicExportingMetricReader({
      exporter,
      exportIntervalMillis: 60_000,
    });
    const provider = new MeterProvider({ readers: [reader] });
    service = new MetricsService(provider.getMeter('test'));
  });

  it('결제 불일치 카운터는 사유별로 누적된다', async () => {
    service.paymentMismatch('amount');
    service.paymentMismatch('amount');
    service.paymentMismatch('currency');
    const points = await collect(exporter, reader);
    const dps = points['lunote_payment_mismatch'];
    expect(dps.find((d) => d.attrs.reason === 'amount')?.value).toBe(2);
    expect(dps.find((d) => d.attrs.reason === 'currency')?.value).toBe(1);
  });

  it('웹훅 실패 카운터는 사유별로 누적된다', async () => {
    service.webhookFailure('signature');
    service.webhookFailure('unknown_payment');
    const points = await collect(exporter, reader);
    const value = (reason: string) =>
      points['lunote_portone_webhook_failures'].find(
        (d) => d.attrs.reason === reason,
      )?.value;
    expect(value('signature')).toBe(1);
    expect(value('unknown_payment')).toBe(1);
    expect(value('missing_id')).toBe(0);
  });

  it('계정 삭제 카운터는 결과별, 정리 실패 카운터는 단일 값으로 누적된다', async () => {
    service.accountDeletion('deleted');
    service.accountDeletion('deleted');
    service.accountDeletion('blocked');
    service.accountCleanupFailure();
    const points = await collect(exporter, reader);
    const deletion = (result: string) =>
      points['lunote_account_deletions'].find((d) => d.attrs.result === result)
        ?.value;
    expect(deletion('deleted')).toBe(2);
    expect(deletion('blocked')).toBe(1);
    expect(points['lunote_account_cleanup_failures'][0].value).toBe(1);
  });

  it('기록 전에도 모든 사유가 0으로 노출된다 — 알림 increase()가 첫 발생을 놓치지 않게', async () => {
    const points = await collect(exporter, reader);
    const zeros = (name: string) =>
      points[name]
        .filter((d) => d.value === 0)
        .map((d) => d.attrs.reason)
        .sort();
    expect(zeros('lunote_payment_mismatch')).toEqual([
      'amount',
      'currency',
      'request_status',
    ]);
    expect(zeros('lunote_portone_webhook_failures')).toEqual([
      'exception',
      'missing_id',
      'signature',
      'unknown_payment',
    ]);
    expect(
      points['lunote_account_deletions']
        .filter((d) => d.value === 0)
        .map((d) => d.attrs.result)
        .sort(),
    ).toEqual(['blocked', 'deleted']);
    expect(points['lunote_account_cleanup_failures'][0].value).toBe(0);
  });
});

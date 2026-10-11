import { FailOpenThrottlerStorage } from './throttler-storage';

describe('FailOpenThrottlerStorage', () => {
  it('Redis에 닿지 못하면 제한 없이 통과시키고, 기다리지 않는다', async () => {
    // 1번 포트 — 아무도 듣지 않는다(연결 거부)
    const storage = new FailOpenThrottlerStorage('redis://127.0.0.1:1');
    const started = Date.now();
    try {
      const record = await storage.increment(
        'ip',
        60_000,
        5,
        60_000,
        'default',
      );
      expect(record).toEqual({
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      });
      // 오프라인 큐에 쌓여 재연결을 기다리면 안 된다
      expect(Date.now() - started).toBeLessThan(1500);
    } finally {
      storage.onModuleDestroy();
    }
  });
});

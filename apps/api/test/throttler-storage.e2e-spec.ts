import { FailOpenThrottlerStorage } from '../src/config/throttler-storage';

// 로컬 docker compose 또는 CI 사이드카의 Redis를 사용한다
describe('rate limit 저장소 (e2e)', () => {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  // Pod 2개를 흉내 낸다 — 연결이 서로 다른 인스턴스
  const podA = new FailOpenThrottlerStorage(url);
  const podB = new FailOpenThrottlerStorage(url);
  // 실행마다 유니크한 키 — 반복 실행·다른 스위트와 충돌하지 않는다
  const key = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeAll(async () => {
    // 연결 전의 명령은 통과 처리(totalHits 0)된다 — 실제로 세기 시작할 때까지 기다린다
    for (const pod of [podA, podB]) {
      let ready = false;
      for (let i = 0; i < 50 && !ready; i++) {
        const r = await pod.increment(`${key}-warmup`, 1000, 1000, 1000, 'w');
        ready = r.totalHits > 0;
        if (!ready) await new Promise((res) => setTimeout(res, 100));
      }
      expect(ready).toBe(true);
    }
  });

  afterAll(() => {
    podA.onModuleDestroy();
    podB.onModuleDestroy();
  });

  it('다른 인스턴스가 올린 횟수를 이어서 센다', async () => {
    for (let i = 0; i < 3; i++) {
      await podA.increment(key, 60_000, 3, 60_000, 'default');
    }
    const fromB = await podB.increment(key, 60_000, 3, 60_000, 'default');
    expect(fromB.totalHits).toBe(4);
    expect(fromB.isBlocked).toBe(true);
  });
});

import { Logger } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { redisConnectionFromUrl } from './redis-connection';

type ThrottlerRecord = Awaited<
  ReturnType<ThrottlerStorageRedisService['increment']>
>;

/**
 * rate limit 카운터를 Redis에 둔다 — Pod가 여러 개여도 한도가 하나로 세어진다.
 * Redis 장애 시에는 제한 없이 통과시킨다(fail-open): Redis는 단일 노드라, rate limit 때문에
 * API 전체가 멈추는 것보다 한도 없이 도는 편이 낫다. 인증 코드 시도 횟수는 DB에 세므로 계속 지켜진다.
 */
export class FailOpenThrottlerStorage extends ThrottlerStorageRedisService {
  private readonly logger = new Logger(FailOpenThrottlerStorage.name);
  private failing = false;

  constructor(redisUrl: string) {
    super({
      ...redisConnectionFromUrl(redisUrl),
      // 기본값이면 Redis가 죽었을 때 명령이 재연결까지 대기해 모든 요청이 멈춘다
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 500,
    });
    // 리스너가 없으면 ioredis가 연결 오류마다 콘솔에 직접 쓴다 — 장애 로그는 increment에서 남긴다
    this.redis.on('error', () => undefined);
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerRecord> {
    try {
      const record = await super.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
      if (this.failing) {
        this.failing = false;
        this.logger.log('rate limit 저장소(Redis) 복구');
      }
      return record;
    } catch (e) {
      // 요청마다 찍지 않는다 — 장애가 시작될 때 한 번만
      if (!this.failing) {
        this.failing = true;
        this.logger.error(
          `rate limit 저장소(Redis) 장애 — 제한 없이 통과시킨다: ${(e as Error).message}`,
        );
      }
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}

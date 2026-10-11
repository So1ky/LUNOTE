import { redisConnectionFromUrl } from './redis-connection';

describe('redisConnectionFromUrl', () => {
  it('로컬 기본 URL은 host/port만 만든다', () => {
    expect(redisConnectionFromUrl('redis://localhost:6379')).toEqual({
      host: 'localhost',
      port: 6379,
    });
  });

  it('포트가 없으면 6379', () => {
    expect(redisConnectionFromUrl('redis://cache').port).toBe(6379);
  });

  it('rediss:// 는 TLS, 사용자정보는 AUTH, 경로는 DB 번호', () => {
    expect(
      redisConnectionFromUrl(
        'rediss://default:s3cret@cache.example.com:6380/1',
      ),
    ).toEqual({
      host: 'cache.example.com',
      port: 6380,
      username: 'default',
      password: 's3cret',
      db: 1,
      tls: {},
    });
  });

  it('URL 인코딩된 비밀번호를 복원한다', () => {
    expect(redisConnectionFromUrl('redis://:p%40ss@h:6379').password).toBe(
      'p@ss',
    );
  });

  it('DB 번호가 숫자가 아니면 기동 단계에서 실패시킨다', () => {
    expect(() => redisConnectionFromUrl('redis://h:6379/abc')).toThrow(
      'REDIS_URL',
    );
  });

  it('URL 자체가 깨졌을 때 에러에 원본(비밀번호 포함)을 싣지 않는다', () => {
    const raw = 'rediss://default:s3cret@host:notaport';
    let caught: unknown;
    try {
      redisConnectionFromUrl(raw);
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toContain('형식');
    expect(
      JSON.stringify(caught, Object.getOwnPropertyNames(caught)),
    ).not.toContain('s3cret');
  });
});

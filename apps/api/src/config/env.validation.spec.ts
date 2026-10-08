import { validateEnv } from './env.validation';

// 비프로덕션 필수값만 채운 최소 설정 (NODE_ENV 미설정 = 개발)
const base = (): Record<string, unknown> => ({
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'test',
  S3_BUCKET: 'bucket',
  S3_REGION: 'ap-northeast-2',
});

describe('validateEnv — THROTTLE_DEFAULT_LIMIT', () => {
  it('없으면 기본값 100', () => {
    expect(validateEnv(base()).THROTTLE_DEFAULT_LIMIT).toBe('100');
  });

  it('양의 정수는 그대로 통과', () => {
    expect(
      validateEnv({ ...base(), THROTTLE_DEFAULT_LIMIT: '100000' })
        .THROTTLE_DEFAULT_LIMIT,
    ).toBe('100000');
  });

  it.each(['0', '-1', '1.5', 'abc', ''])(
    '%p 이면 기동 실패 — 제한이 조용히 꺼지지 않게',
    (value) => {
      expect(() =>
        validateEnv({ ...base(), THROTTLE_DEFAULT_LIMIT: value }),
      ).toThrow('THROTTLE_DEFAULT_LIMIT');
    },
  );
});

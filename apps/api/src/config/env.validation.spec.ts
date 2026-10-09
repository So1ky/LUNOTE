import { SOCIAL_ENV_KEYS, validateEnv } from './env.validation';

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

// 프로덕션 필수값을 모두 채운 설정
const prodBase = (): Record<string, unknown> => ({
  ...base(),
  NODE_ENV: 'production',
  REDIS_URL: 'redis://r:6379',
  CORS_ORIGINS: 'https://admin.example',
  SMTP_HOST: 'smtp.example',
  HOST: '0.0.0.0',
  PORTONE_API_SECRET: 'x',
  PORTONE_WEBHOOK_SECRET: 'x',
  PORTONE_STORE_ID: 'x',
  PORTONE_PAYPAL_CHANNEL_KEY: 'x',
  GOOGLE_WEB_CLIENT_ID: 'x.apps.googleusercontent.com',
  APPLE_TEAM_ID: 'TEAMID',
  APPLE_KEY_ID: 'KEYID',
  // 시크릿 커밋 차단 훅 패턴과 겹치지 않게 더미 값은 PEM 헤더 없이 둔다
  APPLE_PRIVATE_KEY: 'dummy-p8-key',
});

describe('validateEnv — 소셜 로그인', () => {
  it('APPLE_BUNDLE_ID 기본값은 com.lunoteapp', () => {
    expect(validateEnv(base()).APPLE_BUNDLE_ID).toBe('com.lunoteapp');
  });

  it('프로덕션 필수값이 모두 있으면 통과', () => {
    expect(() => validateEnv(prodBase())).not.toThrow();
  });

  it.each(SOCIAL_ENV_KEYS)('프로덕션에서 %s 없으면 기동 실패', (key) => {
    const config = prodBase();
    delete config[key];
    expect(() => validateEnv(config)).toThrow(key);
  });

  it('로컬은 소셜 값 없이 기동된다 (엔드포인트만 503)', () => {
    expect(() => validateEnv(base())).not.toThrow();
  });
});

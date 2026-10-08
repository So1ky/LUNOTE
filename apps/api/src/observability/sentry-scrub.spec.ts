import type { ErrorEvent } from '@sentry/nestjs';
import { scrubSentryEvent } from './sentry-scrub';

describe('scrubSentryEvent', () => {
  it('요청에서 method와 쿼리 뺀 URL만 남긴다 — 헤더·쿠키·본문·쿼리 제거', () => {
    // Sentry 10.67 기본 설정이 실제로 싣던 모양(로컬 가짜 수신기 실측)
    const event: ErrorEvent = {
      type: undefined,
      request: {
        method: 'POST',
        url: 'https://api.lunoteapp.com/auth/login?token=qs-secret&page=2',
        headers: {
          authorization: 'Bearer JWT-SECRET',
          cookie: 'refresh=COOKIE-SECRET',
        },
        cookies: { refresh: 'COOKIE-SECRET' },
        query_string: 'token=qs-secret&page=2',
        data: '{"email":"a@b.c","password":"PW-SECRET"}',
      },
    };

    const out = scrubSentryEvent(event);

    expect(out.request).toEqual({
      method: 'POST',
      url: 'https://api.lunoteapp.com/auth/login',
    });
    expect(JSON.stringify(out)).not.toMatch(/SECRET|a@b\.c/);
  });

  it('URL의 fragment도 제거한다', () => {
    const out = scrubSentryEvent({
      type: undefined,
      request: { method: 'GET', url: 'https://x/p#frag' },
    });
    expect(out.request).toEqual({ method: 'GET', url: 'https://x/p' });
  });

  it('요청이 없는 이벤트(백그라운드 잡 등)는 그대로 둔다', () => {
    const event: ErrorEvent = { type: undefined, message: 'boom' };
    expect(scrubSentryEvent(event)).toEqual({
      type: undefined,
      message: 'boom',
    });
  });
});

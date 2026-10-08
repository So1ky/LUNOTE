import type { ErrorEvent } from '@sentry/nestjs';

/**
 * Sentry beforeSend — 요청 정보는 허용 목록(method, 쿼리·fragment 뺀 URL)만 남긴다.
 * Sentry 10.67 기본 설정(sendDefaultPii 미지정)도 에러 이벤트에 Authorization·쿠키·쿼리·요청 본문을
 * 그대로 실었다(로컬 가짜 수신기 실측 — 로그인 비밀번호 포함). 기본값의 deny 필터는 스팬 경로에만 적용된다.
 * 거부 목록이 아니라 허용 목록이라 새 헤더·필드가 생겨도 새지 않는다.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (!event.request) return event;
  const { method, url } = event.request;
  event.request = { method, url: url?.split(/[?#]/)[0] };
  return event;
}

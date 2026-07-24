import { tokenStorage } from './token-storage';

/**
 * 백엔드 API 클라이언트.
 * - iOS 시뮬레이터는 맥의 localhost를 그대로 쓸 수 있다.
 * - 실기기/안드로이드 에뮬레이터는 EXPO_PUBLIC_API_URL로 주소를 지정한다.
 *   (안드로이드 에뮬레이터: http://10.0.2.2:3000, 실기기: 맥의 LAN IP + API를 HOST=0.0.0.0으로)
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** 무응답 요청은 끊는다 — 모바일 네트워크에서 무한 대기 방지 */
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  /** 자동 갱신 후 1회 재시도 표시 — 무한 재귀 방지 */
  _retry?: boolean;
};

// 인증 이벤트 훅 — AuthProvider가 등록한다 (모듈 순환 의존을 피하기 위한 콜백 방식)
let onTokensRefreshed: ((accessToken: string) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAuthEventHandlers(handlers: {
  onTokensRefreshed: (accessToken: string) => void;
  onSessionExpired: () => void;
}) {
  onTokensRefreshed = handlers.onTokensRefreshed;
  onSessionExpired = handlers.onSessionExpired;
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// 단일 비행(single-flight): 동시 401이 여러 번 나도 갱신 요청은 한 번만
let refreshing: Promise<string | null> | null = null;

/** 리프레시 토큰으로 새 쌍 발급. 실패하면 저장 토큰을 지우고 null. */
function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await tokenStorage.getRefresh();
      if (!refreshToken) return null;
      const res = await rawFetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // 폐기/만료된 세션 — 로컬 토큰도 정리
        await tokenStorage.clear();
        return null;
      }
      const pair = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      await tokenStorage.setPair(pair.accessToken, pair.refreshToken);
      onTokensRefreshed?.(pair.accessToken);
      return pair.accessToken;
    } catch {
      return null; // 네트워크 실패 — 토큰은 남겨두고 다음 기회에 재시도
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  let res: Response;
  try {
    res = await rawFetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(
      0,
      (e as Error).name === 'AbortError'
        ? 'Request timed out. Check your connection.'
        : 'Cannot reach the server. Is the API running?',
    );
  }

  // 액세스 만료(30분) → 리프레시로 갱신 후 원 요청 1회 재시도
  if (res.status === 401 && token && !options._retry && path !== '/auth/refresh') {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return api<T>(path, { ...options, token: newAccess, _retry: true });
    }
    onSessionExpired?.(); // 갱신 불가 — 로그인 화면으로
  }

  if (!res.ok) {
    // NestJS 에러 형식: { message: string | string[], statusCode }
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message.join('\n');
      else if (data.message) message = data.message;
    } catch {
      // 본문이 JSON이 아니면 기본 메시지 유지
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

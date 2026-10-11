/** API 클라이언트 — apps/mobile/src/lib/api.ts 와 같은 규약 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'lunote-admin-token';
const REFRESH_KEY = 'lunote-admin-refresh';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setPair: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// 액세스(30분) 만료 시 자동 갱신 — 단일 비행으로 중복 갱신 방지
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const refreshToken = tokenStore.getRefresh();
      if (!refreshToken) return null;
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const pair = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      tokenStore.setPair(pair.accessToken, pair.refreshToken);
      return pair.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  /** 인증 없이 호출 (로그인) */
  anonymous?: boolean;
  /** 자동 갱신 후 1회 재시도 표시 */
  _retry?: boolean;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(!options.anonymous && token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !options.anonymous && !options._retry && token) {
    const newAccess = await refreshAccessToken();
    if (newAccess) return api<T>(path, { ...options, _retry: true });
  }

  if (!res.ok) {
    // 토큰 만료·갱신 실패 시 로그인으로 (컴포넌트가 401을 감지해 처리)
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (data.message) {
        message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
      }
    } catch {
      // 본문 없는 에러는 기본 메시지 유지
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** API 클라이언트 — apps/mobile/src/lib/api.ts 와 같은 규약 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'lunote-admin-token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

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

  if (!res.ok) {
    // 토큰 만료 시 로그인으로 (컴포넌트가 401을 감지해 처리)
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

/**
 * 백엔드 API 클라이언트.
 * - iOS 시뮬레이터는 맥의 localhost를 그대로 쓸 수 있다.
 * - 실기기/안드로이드 에뮬레이터는 EXPO_PUBLIC_API_URL로 주소를 지정한다.
 *   (안드로이드 에뮬레이터: http://10.0.2.2:3000, 실기기: 맥의 LAN IP + API를 HOST=0.0.0.0으로)
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
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

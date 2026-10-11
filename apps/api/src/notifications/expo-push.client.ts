import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  channelId?: string;
};

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | { status: 'error'; message: string; details?: { error?: string } };

const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100; // Expo 권장 최대 배치

/**
 * Expo Push Service 호출 — 의존성 없이 fetch. 영수증(receipt) 폴링은 하지 않는다(스펙 범위 밖).
 * EXPO_PUSH_ACCESS_TOKEN은 선택값: Expo 대시보드에서 Enhanced push security를 켜면 필수.
 */
@Injectable()
export class ExpoPushClient {
  private readonly accessToken: string | null;

  constructor(config: ConfigService) {
    this.accessToken = config.get<string>('EXPO_PUSH_ACCESS_TOKEN') || null;
  }

  /** 입력과 같은 길이·순서의 티켓 배열. HTTP 실패는 throw → 워커 재시도 */
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const tickets: ExpoPushTicket[] = [];
    for (let i = 0; i < messages.length; i += CHUNK) {
      const chunk = messages.slice(i, i + CHUNK);
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(this.accessToken
            ? { authorization: `Bearer ${this.accessToken}` }
            : {}),
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        throw new Error(`Expo push HTTP ${res.status}`);
      }
      const payload = (await res.json()) as { data?: ExpoPushTicket[] };
      tickets.push(...(payload.data ?? []));
    }
    return tickets;
  }
}

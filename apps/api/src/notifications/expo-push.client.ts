import { Injectable, Logger } from '@nestjs/common';
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
const TIMEOUT_MS = 10_000; // 응답 없는 연결이 워커를 붙잡지 않게

/**
 * Expo Push Service 호출 — 의존성 없이 fetch. 영수증(receipt) 폴링은 하지 않는다(스펙 범위 밖).
 * EXPO_PUSH_ACCESS_TOKEN은 선택값: Expo 대시보드에서 Enhanced push security를 켜면 필수.
 */
@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private readonly accessToken: string | null;

  constructor(config: ConfigService) {
    this.accessToken = config.get<string>('EXPO_PUSH_ACCESS_TOKEN') || null;
  }

  /**
   * 입력과 같은 길이·순서의 티켓 배열. HTTP 실패·타임아웃은 throw → 워커 재시도.
   * 200인데 티켓 수가 다르면 throw하지 않는다 — Expo가 청크를 이미 받았으니 재시도하면 중복 발송.
   * 대신 청크 전체를 TicketCountMismatch 오류 티켓으로 채워 인덱스를 맞춘다(워커는 토큰을 지우지 않음)
   */
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
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`Expo push HTTP ${res.status}`);
      }
      const payload = (await res.json()) as { data?: ExpoPushTicket[] };
      if (payload.data?.length !== chunk.length) {
        // 토큰은 개인 식별자 — 개수만 남긴다
        this.logger.error(
          `Expo push 티켓 수 불일치 expected=${chunk.length} got=${payload.data?.length ?? 'none'}`,
        );
        tickets.push(
          ...chunk.map((): ExpoPushTicket => ({
            status: 'error',
            message: 'ticket count mismatch',
            details: { error: 'TicketCountMismatch' },
          })),
        );
        continue;
      }
      tickets.push(...payload.data);
    }
    return tickets;
  }
}

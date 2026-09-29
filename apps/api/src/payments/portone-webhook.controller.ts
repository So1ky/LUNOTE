import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { PortOneGateway, type PortOneWebhookEvent } from './portone.gateway';

/**
 * PortOne 웹훅 수신 — 인증 없는 공개 엔드포인트. 신뢰의 근거는 오직 서명 검증이다.
 * - 서명 실패 → 401 (재전송돼도 계속 401)
 * - 처리 중 예외 → 500 → PortOne이 최대 5회 지수 백오프 재전송 (이벤트 기록도 함께 롤백됨)
 * - 정상/중복/무관 이벤트 → 200
 */
@ApiExcludeController()
@Controller('payments/portone')
export class PortOneWebhookController {
  private readonly logger = new Logger(PortOneWebhookController.name);

  constructor(
    private readonly gateway: PortOneGateway,
    private readonly payments: PaymentsService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) throw new UnauthorizedException('Missing body');

    let event: PortOneWebhookEvent;
    try {
      event = await this.gateway.verifyWebhook(rawBody, headers);
    } catch (e) {
      // 시크릿 불일치·타임스탬프 이탈·헤더 누락 모두 여기 — 본문은 로그에 남기지 않는다
      this.logger.warn(`웹훅 서명 검증 실패: ${(e as Error).message}`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventId = headers['webhook-id'];
    if (typeof eventId !== 'string' || !eventId) {
      throw new UnauthorizedException('Missing webhook-id');
    }

    const outcome = await this.payments.handleWebhook(eventId, event);
    this.logger.log(`웹훅 처리: type=${String(event.type)} outcome=${outcome}`);
    return { ok: true, outcome };
  }
}

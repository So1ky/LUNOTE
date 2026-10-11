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
import { MetricsService } from '../observability/metrics.service';
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
    private readonly metrics: MetricsService,
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
      this.metrics.webhookFailure('signature');
      this.logger.warn(`웹훅 서명 검증 실패: ${(e as Error).message}`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const eventId = headers['webhook-id'];
    if (typeof eventId !== 'string' || !eventId) {
      this.metrics.webhookFailure('missing_id');
      throw new UnauthorizedException('Missing webhook-id');
    }

    let outcome: Awaited<ReturnType<PaymentsService['handleWebhook']>>;
    try {
      outcome = await this.payments.handleWebhook(eventId, event);
    } catch (e) {
      // 500 → PortOne 재전송. 재전송마다 세므로 같은 이벤트가 여러 번 잡힐 수 있다 — 알림은 "0보다 큼"만 본다
      this.metrics.webhookFailure('exception');
      throw e;
    }
    this.logger.log(`웹훅 처리: type=${String(event.type)} outcome=${outcome}`);
    return { ok: true, outcome };
  }
}

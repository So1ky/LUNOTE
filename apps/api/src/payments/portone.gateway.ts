import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PortOneClient, Webhook } from '@portone/server-sdk';
import type { Payment } from '@portone/server-sdk/payment';
import type { Webhook as WebhookEvent } from '@portone/server-sdk/webhook';

export type PortOnePayment = Payment;
export type PortOneWebhookEvent = WebhookEvent;

/**
 * PortOne 외부 호출의 유일한 통로.
 * - 결제 조회(진실 검증)와 웹훅 서명 검증만 담당한다 — 비즈니스 규칙은 PaymentsService.
 * - e2e 테스트는 이 클래스를 overrideProvider로 대체한다 (실 API 호출 없음).
 * - 로컬에서 시크릿이 비어 있으면 isConfigured=false로 두고 서비스가 503을 낸다 (기동은 된다).
 */
@Injectable()
export class PortOneGateway {
  private readonly logger = new Logger(PortOneGateway.name);
  private readonly client: PortOneClient | null;
  private readonly webhookSecret: string | null;
  readonly storeId: string | null;
  readonly paypalChannelKey: string | null;

  constructor(config: ConfigService) {
    const apiSecret = config.get<string>('PORTONE_API_SECRET') || null;
    this.webhookSecret = config.get<string>('PORTONE_WEBHOOK_SECRET') || null;
    this.storeId = config.get<string>('PORTONE_STORE_ID') || null;
    this.paypalChannelKey =
      config.get<string>('PORTONE_PAYPAL_CHANNEL_KEY') || null;

    this.client =
      apiSecret && this.storeId
        ? PortOneClient({ secret: apiSecret, storeId: this.storeId })
        : null;
    if (!this.isConfigured) {
      this.logger.warn(
        'PortOne 환경변수가 비어 있어 결제 API가 503으로 응답합니다 (로컬 전용 상태)',
      );
    }
  }

  get isConfigured(): boolean {
    return (
      this.client !== null &&
      this.webhookSecret !== null &&
      this.paypalChannelKey !== null
    );
  }

  /** 결제 단건 조회 — 상태 전이 전 금액/통화 교차검증의 원천 */
  getPayment(paymentId: string): Promise<PortOnePayment> {
    if (!this.client) throw new Error('PortOne client not configured');
    return this.client.payment.getPayment({ paymentId });
  }

  /**
   * 웹훅 서명 검증 (Standard Webhooks: webhook-id/timestamp/signature).
   * 원문 body 문자열이 필요하다 — main.ts의 rawBody 옵션이 전제.
   * 실패 시 WebhookVerificationError를 던진다.
   */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<PortOneWebhookEvent> {
    if (!this.webhookSecret)
      throw new Error('PortOne webhook secret not configured');
    return Webhook.verify(this.webhookSecret, rawBody, headers);
  }
}

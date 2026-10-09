import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { createHmac, randomBytes } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  PortOneGateway,
  type PortOnePayment,
} from './../src/payments/portone.gateway';
import { Webhook } from '@portone/server-sdk';

/**
 * 결제 플로우 e2e — PortOne 실 API는 호출하지 않는다.
 * - getPayment: 테스트가 지정한 응답을 돌려주는 가짜 게이트웨이
 * - 웹훅 서명: 실제 SDK(Webhook.verify)로 검증한다 — 서명 생성만 테스트가 흉내낸다
 */
describe('Payments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `pay-adm-${stamp}@test.lunote.app`;
  let ownerToken: string;
  let otherToken: string;
  let adminToken: string;
  let requestId: number;
  let quoteId: string;

  // Standard Webhooks 시크릿 형식: whsec_ + base64
  const webhookKey = randomBytes(32);
  const webhookSecret = `whsec_${webhookKey.toString('base64')}`;
  const storeId = 'store-test';

  /** 가짜 PortOne — remote 상태를 테스트가 바꿔가며 시나리오를 만든다 */
  let remote: PortOnePayment | null = null;
  const fakeGateway = {
    isConfigured: true,
    storeId,
    paypalChannelKey: 'channel-key-paypal-test',
    getPayment: jest.fn((paymentId: string) => {
      if (!remote) {
        return Promise.reject(
          Object.assign(new Error('not found'), {
            data: { type: 'PAYMENT_NOT_FOUND' },
          }),
        );
      }
      return Promise.resolve({ ...remote, id: paymentId });
    }),
    verifyWebhook: (
      rawBody: string,
      headers: Record<string, string | string[] | undefined>,
    ) => Webhook.verify(webhookSecret, rawBody, headers),
  };

  const paidRemote = (
    over: Partial<{ total: number; currency: string }> = {},
  ): PortOnePayment =>
    ({
      status: 'PAID',
      id: 'x',
      transactionId: `tx-${stamp}`,
      merchantId: 'm',
      storeId,
      channel: { type: 'TEST', pgProvider: 'PAYPAL_V2', pgMerchantId: 'pm' },
      version: 'V2',
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
      orderName: 'LUNOTE',
      amount: {
        total: over.total ?? 34000,
        taxFree: 0,
        discount: 0,
        paid: over.total ?? 34000,
        cancelled: 0,
        cancelledTaxFree: 0,
      },
      currency: over.currency ?? 'USD',
      paidAt: new Date().toISOString(),
    }) as unknown as PortOnePayment;

  const signedWebhook = (
    body: object,
    id = `evt-${randomBytes(6).toString('hex')}`,
  ) => {
    const raw = JSON.stringify(body);
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac('sha256', webhookKey)
      .update(`${id}.${ts}.${raw}`)
      .digest('base64');
    return {
      raw,
      headers: {
        'webhook-id': id,
        'webhook-timestamp': ts,
        'webhook-signature': `v1,${sig}`,
      },
    };
  };

  const postWebhook = (raw: string, headers: Record<string, string>) =>
    request(app.getHttpServer())
      .post('/payments/portone/webhook')
      .set(headers)
      .set('Content-Type', 'application/json')
      .send(raw);

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
    return (res.body as { accessToken: string }).accessToken;
  };
  const login = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortOneGateway)
      .useValue(fakeGateway)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    ownerToken = await signup(`pay-owner-${stamp}@test.lunote.app`);
    otherToken = await signup(`pay-other-${stamp}@test.lunote.app`);
    await signup(adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    adminToken = await login(adminEmail);

    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        category: 'HOUSING',
        description: 'Need help finding a studio near Gangnam station.',
        contactMethod: 'email: owner@test.com',
      })
      .expect(201);
    requestId = (created.body as { id: number }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /payments — 견적 전(REVIEWING)에는 404 (결제할 견적이 없음)', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
  });

  it('관리자 견적 발행 → QUOTED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 340,
        currency: 'USD',
        explanation: 'Three viewings + contract translation.',
      })
      .expect(201);
    quoteId = (res.body as { quote: { id: string } }).quote.id;
    expect((res.body as { status: string }).status).toBe('QUOTED');
  });

  it('POST /payments — 남의 견적은 404', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ quoteId })
      .expect(404);
  });

  it('POST /payments — 금액/통화 필드를 보내면 400 (서버 견적만 신뢰)', async () => {
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId, totalAmount: 1 })
      .expect(400);
  });

  let paymentId: string;

  it('POST /payments — 결제 의도: 서버 견적 기준 센트 단위 금액 + 공개 식별자만 반환', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId })
      .expect(201);
    const body = res.body as {
      paymentId: string;
      provider: string;
      storeId: string;
      channelKey: string;
      totalAmount: number;
      currency: string;
      amount: string;
      orderName: string;
    };
    paymentId = body.paymentId;
    expect(body.provider).toBe('PAYPAL');
    expect(body.totalAmount).toBe(34000); // 340.00 USD → 센트
    expect(body.currency).toBe('USD');
    expect(body.amount).toBe('340');
    expect(body.storeId).toBe(storeId);
    expect(body.channelKey).toBe('channel-key-paypal-test');
    expect(body.orderName).toContain(`#${requestId}`);
    expect(JSON.stringify(body)).not.toMatch(/secret/i);
  });

  it('POST /payments — 같은 견적을 다시 요청하면 PENDING 시도를 재사용한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId })
      .expect(201);
    expect((res.body as { paymentId: string }).paymentId).toBe(paymentId);
  });

  it('POST /payments/:id/confirm — PortOne에 시도가 없으면(PAYMENT_NOT_FOUND) PENDING 유지', async () => {
    remote = null;
    const res = await request(app.getHttpServer())
      .post(`/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect((res.body as { status: string }).status).toBe('PENDING');
  });

  it('웹훅 — 서명이 틀리면 401이고 아무것도 바뀌지 않는다', async () => {
    remote = paidRemote();
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Paid',
      timestamp: new Date().toISOString(),
      data: { paymentId, storeId, transactionId: 'tx' },
    });
    await postWebhook(raw, {
      ...headers,
      'webhook-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    }).expect(401);
    await postWebhook(raw, {}).expect(401); // 헤더 없음
    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(p?.status).toBe('PENDING');
  });

  it('웹훅 — 금액 불일치면 상태 전이 없이 관리자 알림만', async () => {
    remote = paidRemote({ total: 1000 }); // $10.00 — 청구액과 다름
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Paid',
      timestamp: new Date().toISOString(),
      data: { paymentId, storeId, transactionId: 'tx' },
    });
    const res = await postWebhook(raw, headers).expect(200);
    expect((res.body as { outcome: string }).outcome).toBe('mismatch');

    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(p?.status).toBe('PENDING');
    expect(p?.failReason).toContain('MISMATCH');
    const req = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });
    expect(req?.status).toBe('QUOTED');
    const adminNoti = await prisma.notification.findFirst({
      where: { type: 'PAYMENT_MISMATCH', requestId },
    });
    expect(adminNoti).not.toBeNull();
  });

  let mismatchPaymentId: string;

  it('POST /payments — 불일치 결제는 재사용하지 않고 새 시도를 만든다', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId })
      .expect(201);
    mismatchPaymentId = paymentId;
    paymentId = (res.body as { paymentId: string }).paymentId; // 이후 시나리오는 재시도 결제로 진행
    expect(paymentId).not.toBe(mismatchPaymentId);
  });

  it('웹훅 — 검증 통과 + 금액 일치 → PAID 전이 + 인앱 알림', async () => {
    remote = paidRemote();
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Paid',
      timestamp: new Date().toISOString(),
      data: { paymentId, storeId, transactionId: `tx-${stamp}` },
    });
    const res = await postWebhook(raw, headers).expect(200);
    expect((res.body as { outcome: string }).outcome).toBe('paid');

    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(p?.status).toBe('PAID');
    expect(p?.portoneTxId).toBe(`tx-${stamp}`);
    expect(p?.paidAt).not.toBeNull();
    const req = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });
    expect(req?.status).toBe('PAID');

    const owner = await prisma.user.findUnique({
      where: { email: `pay-owner-${stamp}@test.lunote.app` },
    });
    const noti = await prisma.notification.findFirst({
      where: { userId: owner!.id, type: 'PAYMENT_PAID', requestId },
    });
    expect(noti).not.toBeNull();
    const event = await prisma.paymentEvent.findUnique({
      where: { eventId: headers['webhook-id'] },
    });
    expect(event?.paymentId).toBe(paymentId);
  });

  it('웹훅 — 같은 이벤트 재전송은 200 duplicate, 상태 그대로', async () => {
    const { raw, headers } = signedWebhook(
      {
        type: 'Transaction.Paid',
        timestamp: new Date().toISOString(),
        data: { paymentId, storeId, transactionId: `tx-${stamp}` },
      },
      `evt-dup-${stamp}`,
    );
    await postWebhook(raw, headers).expect(200);
    const again = await postWebhook(raw, headers).expect(200);
    expect((again.body as { outcome: string }).outcome).toBe('duplicate');
    const count = await prisma.paymentEvent.count({
      where: { eventId: `evt-dup-${stamp}` },
    });
    expect(count).toBe(1);
  });

  it('POST /payments/:id/confirm — 이미 PAID면 멱등 (noop)', async () => {
    remote = paidRemote();
    const res = await request(app.getHttpServer())
      .post(`/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect((res.body as { status: string }).status).toBe('PAID');
    const paidCount = await prisma.payment.count({
      where: { quoteId, status: 'PAID' },
    });
    expect(paidCount).toBe(1);
  });

  it('POST /payments — 결제 완료된 견적은 409 QUOTE_NOT_PAYABLE', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId })
      .expect(409);
    expect((res.body as { message: string }).message).toBe('QUOTE_NOT_PAYABLE');
  });

  it('GET /payments/:id — 남의 결제는 404', async () => {
    await request(app.getHttpServer())
      .get(`/payments/${paymentId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/payments/${paymentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  it('웹훅 — 모르는 paymentId는 200 unknown_payment (재전송 유도 안 함)', async () => {
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Paid',
      timestamp: new Date().toISOString(),
      data: { paymentId: 'not-ours', storeId, transactionId: 'tx' },
    });
    const res = await postWebhook(raw, headers).expect(200);
    expect((res.body as { outcome: string }).outcome).toBe('unknown_payment');
  });

  it('웹훅 — 불일치(PENDING) 결제 환불 → REFUNDED, 불일치 기록 유지, 재시도로 PAID된 문의는 그대로', async () => {
    remote = {
      ...paidRemote({ total: 1000 }),
      status: 'CANCELLED',
    } as unknown as PortOnePayment;
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Cancelled',
      timestamp: new Date().toISOString(),
      data: {
        paymentId: mismatchPaymentId,
        storeId,
        transactionId: 'tx',
        cancellationId: 'c0',
      },
    });
    const res = await postWebhook(raw, headers).expect(200);
    expect((res.body as { outcome: string }).outcome).toBe('refunded');

    const p = await prisma.payment.findUnique({
      where: { id: mismatchPaymentId },
    });
    expect(p?.status).toBe('REFUNDED');
    expect(p?.failReason).toContain('MISMATCH');
    const req = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });
    expect(req?.status).toBe('PAID');
  });

  it('웹훅 — 환불(Transaction.Cancelled) → REFUNDED', async () => {
    remote = {
      ...paidRemote(),
      status: 'CANCELLED',
    } as unknown as PortOnePayment;
    const { raw, headers } = signedWebhook({
      type: 'Transaction.Cancelled',
      timestamp: new Date().toISOString(),
      data: {
        paymentId,
        storeId,
        transactionId: `tx-${stamp}`,
        cancellationId: 'c1',
      },
    });
    const res = await postWebhook(raw, headers).expect(200);
    expect((res.body as { outcome: string }).outcome).toBe('refunded');
    const req = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });
    expect(req?.status).toBe('REFUNDED');
  });
});

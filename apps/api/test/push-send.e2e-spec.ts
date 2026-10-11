import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import {
  ExpoPushClient,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from './../src/notifications/expo-push.client';
import { BankTransferConfig } from './../src/payments/bank-transfer.config';
import { PrismaService } from './../src/prisma/prisma.service';

/** 가짜 Expo — 받은 메시지를 기록하고, 지정한 토큰에는 DeviceNotRegistered를 돌려준다 */
class FakeExpo {
  calls: ExpoPushMessage[][] = [];
  dead = new Set<string>();
  send = jest.fn((messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> => {
    this.calls.push(messages);
    return Promise.resolve(
      messages.map((m): ExpoPushTicket =>
        this.dead.has(m.to)
          ? {
              status: 'error',
              message: 'not registered',
              details: { error: 'DeviceNotRegistered' },
            }
          : { status: 'ok', id: 'ticket' },
      ),
    );
  });
}

describe('Push send (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const expo = new FakeExpo();
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `push-adm-${stamp}@test.lunote.app`;
  const ownerEmail = `push-own-${stamp}@test.lunote.app`;
  const liveToken = `ExponentPushToken[live-${stamp}]`;
  const deadToken = `ExponentPushToken[dead-${stamp}]`;
  let ownerToken: string;
  let adminToken: string;

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, termsAccepted: true })
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
  /** 워커가 비동기라 조건이 참이 될 때까지 폴링 */
  const waitFor = async <T>(fn: () => Promise<T | null>, ms = 10_000) => {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      const r = await fn();
      if (r) return r;
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  };
  const createRequest = async () => {
    const res = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        category: 'HOUSING',
        description: 'Need a studio near Hongdae please.',
        contactMethod: 'email: o@test.com',
      })
      .expect(201);
    return (res.body as { id: number }).id;
  };
  const sendQuote = (requestId: number) =>
    request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 340, explanation: 'Three viewings and contract support' })
      .expect(201);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ExpoPushClient)
      .useValue(expo)
      // 계좌이체 결제 확정 경로용 — 로컬 .env에 계좌 설정이 없어도 돌게
      .overrideProvider(BankTransferConfig)
      .useValue({
        isConfigured: true,
        bank: { name: 'KB', accountNumber: '1', holder: 'Lunote' },
      })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    ownerToken = await signup(ownerEmail);
    await signup(adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    adminToken = await login(adminEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  it('토큰이 없으면 견적 발행 시 Expo를 호출하지 않는다', async () => {
    const id = await createRequest();
    await sendQuote(id);
    // 인앱 알림은 생겼는지(원천) 확인한 뒤 잠깐 기다려 호출이 없음을 본다
    await waitFor(async () =>
      prisma.notification.findFirst({
        where: { requestId: id, type: 'QUOTE_SENT' },
      }),
    );
    await new Promise((r) => setTimeout(r, 800));
    expect(expo.send).not.toHaveBeenCalled();
  });

  it('토큰이 있으면 견적 발행 → 인앱 알림과 같은 제목·본문·requestId로 푸시', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: liveToken, platform: 'IOS' })
      .expect(204);
    const id = await createRequest();
    await sendQuote(id);
    const call = await waitFor(() =>
      Promise.resolve(
        expo.calls.find((c) => c.some((m) => m.data?.requestId === id)) ?? null,
      ),
    );
    expect(call).not.toBeNull();
    const msg = call!.find((m) => m.to === liveToken)!;
    const inApp = await prisma.notification.findFirstOrThrow({
      where: { requestId: id, type: 'QUOTE_SENT', user: { email: ownerEmail } },
    });
    expect(msg.title).toBe(inApp.title);
    expect(msg.body).toBe(inApp.body);
    expect(msg.sound).toBe('default');
    expect(msg.channelId).toBe('default');
  });

  it('DeviceNotRegistered 토큰은 삭제되고 살아있는 토큰은 남는다', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: deadToken, platform: 'ANDROID' })
      .expect(204);
    expo.dead.add(deadToken);
    const id = await createRequest();
    await sendQuote(id);
    const gone = await waitFor(async () =>
      (await prisma.pushToken.count({ where: { token: deadToken } })) === 0
        ? true
        : null,
    );
    expect(gone).toBe(true);
    expect(await prisma.pushToken.count({ where: { token: liveToken } })).toBe(
      1,
    );
  });

  it('계좌이체 입금 확인(PAID) → 결제 완료 푸시', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ token: liveToken, platform: 'IOS' })
      .expect(204);
    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        category: 'BANK',
        description: 'I want to pay by Korean bank transfer please.',
        contactMethod: 'email: o@test.com',
        paymentMethod: 'BANK_TRANSFER',
      })
      .expect(201);
    const id = (created.body as { id: number }).id;
    const quoted = await request(app.getHttpServer())
      .post(`/admin/quote-requests/${id}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 150000, explanation: 'Bank account opening support' })
      .expect(201);
    const quoteId = (quoted.body as { quote: { id: string } }).quote.id;
    const paid = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId, withdrawalConsent: true })
      .expect(201);
    const paymentId = (paid.body as { paymentId: string }).paymentId;
    await request(app.getHttpServer())
      .post(`/admin/payments/${paymentId}/confirm-transfer`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const msg = await waitFor(() =>
      Promise.resolve(
        expo.calls
          .flat()
          .find(
            (m) => m.data?.requestId === id && m.title === 'Payment received',
          ) ?? null,
      ),
    );
    expect(msg).not.toBeNull();
    expect(msg!.to).toBe(liveToken);
  });
});

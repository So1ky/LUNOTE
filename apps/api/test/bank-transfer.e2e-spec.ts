import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { BankTransferConfig } from './../src/payments/bank-transfer.config';
import { PortOneGateway } from './../src/payments/portone.gateway';

/**
 * 수동 계좌이체 e2e — PortOne은 호출되면 안 된다(가짜가 throw).
 * 계좌 설정은 테스트가 주입한다(로컬 .env에 없어도 돌게).
 */
describe('Bank transfer (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `bt-adm-${stamp}@test.lunote.app`;
  let ownerToken: string;
  let adminToken: string;
  let requestId: number;
  let quoteId: string;
  let paymentId: string;

  const fakeGateway = {
    isConfigured: true,
    storeId: 'store-test',
    paypalChannelKey: 'channel-key-paypal-test',
    getPayment: jest.fn(() =>
      Promise.reject(new Error('PortOne must not be called for bank transfer')),
    ),
    verifyWebhook: jest.fn(),
  };
  const fakeBank = {
    isConfigured: true,
    bank: {
      name: 'KB Kookmin Bank',
      accountNumber: '123456-04-123456',
      holder: 'Lunote Inc.',
    },
  };

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PortOneGateway)
      .useValue(fakeGateway)
      .overrideProvider(BankTransferConfig)
      .useValue(fakeBank)
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

    ownerToken = await signup(`bt-owner-${stamp}@test.lunote.app`);
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
        category: 'BANK',
        description:
          'I have a Korean bank account and want to pay by transfer.',
        contactMethod: 'email: owner@test.com',
        paymentMethod: 'BANK_TRANSFER',
      })
      .expect(201);
    requestId = (created.body as { id: number }).id;

    const quoted = await request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 150000,
        explanation: 'Bank account opening, 1 visit with interpreter',
      })
      .expect(201);
    quoteId = (quoted.body as { quote: { id: string; currency: string } }).quote
      .id;
    expect(
      (quoted.body as { quote: { currency: string } }).quote.currency,
    ).toBe('KRW');
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /payments — 계좌 정보·입금자명·기한을 돌려주고 PortOne은 호출하지 않는다', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId, withdrawalConsent: true })
      .expect(201);
    const body = res.body as {
      paymentId: string;
      provider: string;
      amount: string;
      currency: string;
      bank: { name: string; accountNumber: string; holder: string };
      depositorName: string;
      deadline: string;
    };
    paymentId = body.paymentId;
    expect(body.provider).toBe('BANK_TRANSFER');
    expect(body.currency).toBe('KRW');
    expect(body.amount).toBe('150000');
    expect(body.bank).toEqual(fakeBank.bank);
    expect(body.depositorName).toBe(`LUNOTE${requestId}`);
    expect(new Date(body.deadline).getTime()).toBeGreaterThan(Date.now());
    expect(body).not.toHaveProperty('storeId');
    expect(fakeGateway.getPayment).not.toHaveBeenCalled();
  });

  it('POST /payments — 재요청은 PENDING 시도를 재사용한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId, withdrawalConsent: true })
      .expect(201);
    expect((res.body as { paymentId: string }).paymentId).toBe(paymentId);
  });
});

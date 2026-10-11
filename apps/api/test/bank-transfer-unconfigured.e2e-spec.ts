import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { BankTransferConfig } from './../src/payments/bank-transfer.config';

/**
 * 계좌 정보 미설정 — 기동은 되지만 계좌이체 결제 의도만 503이어야 한다.
 * 다른 spec과 앱 구성이 달라 파일을 분리한다.
 */
describe('Bank transfer — not configured (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `btn-adm-${stamp}@test.lunote.app`;
  let ownerToken: string;
  let adminToken: string;
  let quoteId: string;

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BankTransferConfig)
      .useValue({ isConfigured: false, bank: null })
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

    ownerToken = await signup(`btn-owner-${stamp}@test.lunote.app`);
    await signup(adminEmail);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = (login.body as { accessToken: string }).accessToken;

    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        category: 'BANK',
        description: 'I want to pay by bank transfer, quote in KRW.',
        contactMethod: 'email: unconfigured@test.com',
        paymentMethod: 'BANK_TRANSFER',
      })
      .expect(201);
    const requestId = (created.body as { id: number }).id;
    const quoted = await request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 150000, explanation: 'Bank account opening support' })
      .expect(201);
    quoteId = (quoted.body as { quote: { id: string } }).quote.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /payments — 503 BANK_TRANSFER_NOT_CONFIGURED, 결제 행을 만들지 않는다', async () => {
    const res = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ quoteId, withdrawalConsent: true })
      .expect(503);
    expect((res.body as { message: string }).message).toBe(
      'BANK_TRANSFER_NOT_CONFIGURED',
    );
    expect(await prisma.payment.count({ where: { quoteId } })).toBe(0);
  });
});

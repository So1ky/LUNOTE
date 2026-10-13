import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Admin quotes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `adm-${stamp}@test.lunote.app`;
  let adminToken: string;
  let userToken: string;
  let requestId: number;

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, termsAccepted: true })
      .expect(201);
    const token = (res.body as { accessToken: string }).accessToken;
    await verifyByDb(email);
    return token;
  };
  const verifyByDb = async (email: string) => {
    // 게이트(EmailVerifiedGuard) 통과용 — 인증 플로우 자체는 email-verification 스펙에서 검증
    await prisma.user.update({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
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
    }).compile();

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

    userToken = await signup(`adm-user-${stamp}@test.lunote.app`);
    await signup(adminEmail);
    // 관리자 승격 (운영에서는 scripts/promote-admin.ts 사용)
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });
    // JWT payload의 role은 발급 시점 값이지만, RolesGuard는 JwtStrategy.validate가
    // DB에서 다시 읽은 role을 쓰므로 재로그인 없이도 관리자 권한이 적용된다.
    adminToken = await login(adminEmail);

    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        category: 'VISA',
        description: 'Need help extending my D-2 visa before September.',
        contactMethod: 'email: user@test.com',
      })
      .expect(201);
    requestId = (created.body as { id: number }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('일반 사용자는 admin 목록에 접근 불가 (403)', () => {
    return request(app.getHttpServer())
      .get('/admin/quote-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('무토큰은 401', () => {
    return request(app.getHttpServer())
      .get('/admin/quote-requests')
      .expect(401);
  });

  it('관리자는 전체 문의 목록에서 사용자 문의를 볼 수 있다', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/quote-requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const list = res.body as { id: number; user: { email: string } }[];
    const mine = list.find((r) => r.id === requestId);
    expect(mine).toBeDefined();
    expect(mine!.user.email).toContain('adm-user-');
  });

  it('status 필터가 동작한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/quote-requests?status=REVIEWING')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const list = res.body as { status: string }[];
    expect(list.every((r) => r.status === 'REVIEWING')).toBe(true);
  });

  it('견적 발송 → QUOTED 전이', async () => {
    const res = await request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 340, explanation: 'Visa extension full service.' })
      .expect(201);
    const body = res.body as {
      status: string;
      quote: { amount: string | number };
    };
    expect(body.status).toBe('QUOTED');
    expect(Number(body.quote.amount)).toBe(340);
  });

  it('중복 견적 발송은 409', () => {
    return request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 999, explanation: 'duplicate attempt' })
      .expect(409);
  });

  it('사용자 조회에 견적이 노출된다', async () => {
    const res = await request(app.getHttpServer())
      .get(`/quote-requests/${requestId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    const body = res.body as {
      status: string;
      quote: { amount: string | number; explanation: string };
    };
    expect(body.status).toBe('QUOTED');
    expect(Number(body.quote.amount)).toBe(340);
  });

  it('견적은 발행 후 불변 — 수정 라우트 자체가 없다 (404)', () => {
    return request(app.getHttpServer())
      .patch(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 300 })
      .expect(404);
  });

  it('이미 견적이 있으면 재발송 불가 (409)', () => {
    return request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 500, explanation: 'duplicate attempt' })
      .expect(409);
  });

  it('일반 사용자는 견적 발송 불가 (403)', () => {
    return request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 1, explanation: 'not allowed' })
      .expect(403);
  });

  it('견적에 유효기간(expiresAt ≈ 발행 + 7일)이 설정된다', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/quote-requests/${requestId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const quote = (res.body as { quote: { expiresAt: string } }).quote;
    const diffDays =
      (new Date(quote.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(diffDays).toBeGreaterThan(6.9);
    expect(diffDays).toBeLessThanOrEqual(7.0);
  });

  it('견적 발행이 감사 로그에 기록된다', async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: { targetType: 'QUOTE_REQUEST', targetId: String(requestId) },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('QUOTE_CREATED');
  });

  describe('계좌이체 문의의 견적 통화', () => {
    let btRequestId: number;
    beforeAll(async () => {
      const created = await request(app.getHttpServer())
        .post('/quote-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'BANK',
          description: 'Korean bank account holder, please quote in KRW.',
          contactMethod: 'email: bt@test.com',
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);
      btRequestId = (created.body as { id: number }).id;
    });

    it('USD를 보내면 400 CURRENCY_MISMATCH', async () => {
      const res = await request(app.getHttpServer())
        .post(`/admin/quote-requests/${btRequestId}/quote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150000,
          currency: 'USD',
          explanation: 'Bank account opening support',
        })
        .expect(400);
      expect((res.body as { message: string }).message).toBe(
        'CURRENCY_MISMATCH',
      );
    });

    it('소수점 금액은 400 (KRW는 정수만)', async () => {
      await request(app.getHttpServer())
        .post(`/admin/quote-requests/${btRequestId}/quote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 150000.5, explanation: 'Bank account opening support' })
        .expect(400);
    });

    it('통화를 보내지 않으면 KRW로 발행된다', async () => {
      const res = await request(app.getHttpServer())
        .post(`/admin/quote-requests/${btRequestId}/quote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 150000, explanation: 'Bank account opening support' })
        .expect(201);
      expect((res.body as { quote: { currency: string } }).quote.currency).toBe(
        'KRW',
      );
    });
  });

  describe('통화별 견적 상한', () => {
    const createRequest = async (paymentMethod: 'PAYPAL' | 'BANK_TRANSFER') => {
      const created = await request(app.getHttpServer())
        .post('/quote-requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          category: 'OTHER',
          description: 'Large engagement to check the per-currency cap.',
          contactMethod: 'email: cap@test.com',
          paymentMethod,
        })
        .expect(201);
      return (created.body as { id: number }).id;
    };

    it('USD 1,000,001은 400 AMOUNT_TOO_LARGE', async () => {
      const id = await createRequest('PAYPAL');
      const res = await request(app.getHttpServer())
        .post(`/admin/quote-requests/${id}/quote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 1_000_001, explanation: 'Over the USD cap' })
        .expect(400);
      expect((res.body as { message: string }).message).toBe(
        'AMOUNT_TOO_LARGE',
      );
    });

    // KRW 상한은 DTO 전체 상한과 같아 ValidationPipe가 먼저 400을 낸다(서비스 상한은 방어선)
    it('KRW 100,000,001은 400', async () => {
      const id = await createRequest('BANK_TRANSFER');
      await request(app.getHttpServer())
        .post(`/admin/quote-requests/${id}/quote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100_000_001, explanation: 'Over the KRW cap' })
        .expect(400);
    });
  });
  describe('작업 상태 전이 (PATCH :id/status)', () => {
    // 이 시점의 requestId는 QUOTED — PAID는 결제 흐름(웹훅·입금 확인)이 만드므로 DB로 직접 올린다
    const patchStatus = (token: string, status: string) =>
      request(app.getHttpServer())
        .patch(`/admin/quote-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status });

    it('일반 사용자는 403', () =>
      patchStatus(userToken, 'IN_PROGRESS').expect(403));

    it('관리자가 고를 수 없는 상태(CANCELLED)는 400', () =>
      patchStatus(adminToken, 'CANCELLED').expect(400));

    it('QUOTED에서 IN_PROGRESS는 409', () =>
      patchStatus(adminToken, 'IN_PROGRESS').expect(409));

    it('PAID → IN_PROGRESS: 상태·감사 로그·사용자 인앱 알림', async () => {
      await prisma.quoteRequest.update({
        where: { id: requestId },
        data: { status: 'PAID' },
      });
      const res = await patchStatus(adminToken, 'IN_PROGRESS').expect(200);
      expect((res.body as { status: string }).status).toBe('IN_PROGRESS');

      const logs = await prisma.adminAuditLog.findMany({
        where: {
          targetType: 'QUOTE_REQUEST',
          targetId: String(requestId),
          action: 'REQUEST_STATUS_CHANGED',
        },
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].detail).toEqual({ from: 'PAID', to: 'IN_PROGRESS' });

      const owner = await prisma.quoteRequest.findUniqueOrThrow({
        where: { id: requestId },
        select: { userId: true },
      });
      const notices = await prisma.notification.findMany({
        where: { userId: owner.userId, requestId, type: 'WORK_STARTED' },
      });
      expect(notices).toHaveLength(1);
      expect(notices[0].title).toBe('Work has started');
    });

    it('PAID가 아닌데 IN_PROGRESS 재요청은 409 (멱등 아님, 전이 거부)', () =>
      patchStatus(adminToken, 'IN_PROGRESS').expect(409));

    it('IN_PROGRESS → COMPLETED: 사용자 알림 WORK_COMPLETED', async () => {
      const res = await patchStatus(adminToken, 'COMPLETED').expect(200);
      expect((res.body as { status: string }).status).toBe('COMPLETED');
      const owner = await prisma.quoteRequest.findUniqueOrThrow({
        where: { id: requestId },
        select: { userId: true },
      });
      const notices = await prisma.notification.findMany({
        where: { userId: owner.userId, requestId, type: 'WORK_COMPLETED' },
      });
      expect(notices).toHaveLength(1);
    });

    it('COMPLETED 이후 어떤 전이도 409', async () => {
      await patchStatus(adminToken, 'IN_PROGRESS').expect(409);
      await patchStatus(adminToken, 'COMPLETED').expect(409);
    });

    it('없는 문의는 404', () =>
      request(app.getHttpServer())
        .patch('/admin/quote-requests/999999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(404));
  });
});

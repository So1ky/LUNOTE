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
      .send({ email, password })
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
});

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

  it('견적 수정(QUOTED 상태) → 금액 변경 반영', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 300 })
      .expect(200);
    expect(
      Number((res.body as { quote: { amount: string | number } }).quote.amount),
    ).toBe(300);
  });

  it('일반 사용자는 견적 발송/수정 불가 (403)', () => {
    return request(app.getHttpServer())
      .patch(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 1 })
      .expect(403);
  });

  it('취소된 문의에는 견적 수정 불가 (409)', async () => {
    await request(app.getHttpServer())
      .patch(`/quote-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    return request(app.getHttpServer())
      .patch(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 500 })
      .expect(409);
  });
});

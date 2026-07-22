import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const MAILPIT_API = 'http://localhost:8025/api/v1';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const adminEmail = `noti-admin-${stamp}@test.lunote.app`;
  const userEmail = `noti-user-${stamp}@test.lunote.app`;
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

  /** 조건이 참이 될 때까지 폴링 (워커가 비동기라서) */
  const waitFor = async <T>(fn: () => Promise<T | null>, ms = 10_000) => {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      const result = await fn();
      if (result) return result;
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
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

    userToken = await signup(userEmail);
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

  it('문의 등록 → 관리자 인앱 알림 + 이메일 수신', async () => {
    const created = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        category: 'BANK',
        description: 'Need help opening a bank account as a foreigner.',
        contactMethod: 'email: noti@test.com',
      })
      .expect(201);
    requestId = (created.body as { id: number }).id;

    // 인앱: 관리자 알림함에 나타날 때까지 폴링
    const inApp = await waitFor(async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${adminToken}`);
      const body = res.body as {
        items: { requestId: number | null; type: string }[];
        unreadCount: number;
      };
      const hit = body.items.find(
        (n) => n.requestId === requestId && n.type === 'REQUEST_CREATED',
      );
      return hit ? body : null;
    });
    expect(inApp).not.toBeNull();
    expect(inApp!.unreadCount).toBeGreaterThanOrEqual(1);

    // 이메일: Mailpit API에서 수신 확인
    const mail = await waitFor(async () => {
      const res = await fetch(
        `${MAILPIT_API}/search?query=${encodeURIComponent(adminEmail)}`,
      );
      const data = (await res.json()) as {
        messages: { Subject: string }[];
      };
      return (
        data.messages.find((m) => m.Subject.includes(`#${requestId}`)) ?? null
      );
    });
    expect(mail).not.toBeNull();
  });

  it('견적 발송 → 사용자에게는 인앱 알림만 (이메일 미발송)', async () => {
    await request(app.getHttpServer())
      .post(`/admin/quote-requests/${requestId}/quote`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 120, explanation: 'Bank account opening support.' })
      .expect(201);

    const inApp = await waitFor(async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${userToken}`);
      const body = res.body as {
        items: { id: string; requestId: number | null; type: string }[];
      };
      return (
        body.items.find(
          (n) => n.requestId === requestId && n.type === 'QUOTE_SENT',
        ) ?? null
      );
    });
    expect(inApp).not.toBeNull();

    // 이 사용자를 "수신자"로 하는 메일이 없어야 한다.
    // (Mailpit 검색은 본문도 매칭한다 — 관리자 메일 본문에 사용자 이메일이 들어가므로
    //  검색 결과 개수가 아니라 To 주소로 판별해야 한다)
    const res = await fetch(
      `${MAILPIT_API}/search?query=${encodeURIComponent(userEmail)}`,
    );
    const data = (await res.json()) as {
      messages: { To: { Address: string }[] | null; Subject: string }[];
    };
    // 가입 인증 코드 메일은 정당하므로 제외 — "견적" 메일만 없으면 된다
    const quoteMailsToUser = data.messages.filter(
      (m) =>
        (m.To ?? []).some((t) => t.Address === userEmail) &&
        m.Subject.toLowerCase().includes('quote'),
    );
    expect(quoteMailsToUser).toHaveLength(0);
  });

  it('읽음 처리 → unreadCount 감소, 타인 알림은 404', async () => {
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    const body = list.body as {
      items: { id: string }[];
      unreadCount: number;
    };
    const target = body.items[0];

    // 타인(관리자)이 사용자의 알림을 읽음 처리 시도 → 404
    await request(app.getHttpServer())
      .patch(`/notifications/${target.id}/read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    // 본인은 성공
    await request(app.getHttpServer())
      .patch(`/notifications/${target.id}/read`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const after = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect((after.body as { unreadCount: number }).unreadCount).toBe(
      body.unreadCount - 1,
    );
  });
});

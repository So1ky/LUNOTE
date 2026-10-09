import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  AuthProvider,
  Category,
  PaymentProvider,
  PaymentStatus,
  RequestStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { StorageService } from './../src/storage/storage.service';

describe('Account deletion (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    return res.body as { accessToken: string; refreshToken: string };
  };

  let storage: StorageService;

  /** 문의 1건 시드 — quote/payment 유무로 보존·삭제 분기를 만든다. 첨부 행 1개 포함 */
  const seedRequest = async (
    userId: string,
    status: RequestStatus,
    opts: { quote?: boolean; payment?: PaymentStatus } = {},
  ) => {
    const req = await prisma.quoteRequest.create({
      data: {
        userId,
        category: Category.OTHER,
        description: `seed ${status}`,
        contactMethod: 'kakao: seed-user',
        status,
      },
    });
    await prisma.attachment.create({
      data: {
        requestId: req.id,
        s3Key: `uploads/${userId}/${randomUUID()}/doc.pdf`,
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      },
    });
    if (opts.quote || opts.payment) {
      const quote = await prisma.quote.create({
        data: {
          requestId: req.id,
          amount: 100,
          currency: 'USD',
          explanation: 'seed',
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
      if (opts.payment) {
        await prisma.payment.create({
          data: {
            quoteId: quote.id,
            provider: PaymentProvider.PAYPAL,
            amount: 100,
            currency: 'USD',
            status: opts.payment,
          },
        });
      }
    }
    return req.id;
  };

  const userIdOf = async (email: string) =>
    (await prisma.user.findUniqueOrThrow({ where: { email } })).id;

  /** 조건이 참이 될 때까지 폴링 (워커가 비동기라서) */
  const waitFor = async (fn: () => Promise<boolean>, ms = 15_000) => {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (await fn()) return true;
      await new Promise((r) => setTimeout(r, 300));
    }
    return false;
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
    storage = app.get(StorageService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('deletedAt이 찍힌 사용자의 액세스 토큰은 401', async () => {
    const email = `del-jwt-${stamp}@test.lunote.app`;
    const { accessToken } = await signup(email);
    await prisma.user.update({
      where: { email },
      data: { deletedAt: new Date() },
    });
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('비밀번호가 틀리면 400, 아무것도 바뀌지 않는다', async () => {
    const email = `del-wrong-${stamp}@test.lunote.app`;
    const { accessToken } = await signup(email);
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'wrong-password' })
      .expect(400);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.deletedAt).toBeNull();
  });

  it('비밀번호 없는(소셜) 계정은 403', async () => {
    const social = await prisma.user.create({
      data: {
        email: `del-social-${stamp}@test.lunote.app`,
        provider: AuthProvider.GOOGLE,
        providerId: `g-${stamp}`,
      },
    });
    const token = app
      .get(JwtService, { strict: false })
      .sign({ sub: social.id, role: social.role });
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'anything' })
      .expect(403);
  });

  it('PAID·IN_PROGRESS 문의가 있으면 409, 취소도 롤백된다', async () => {
    const email = `del-active-${stamp}@test.lunote.app`;
    const { accessToken } = await signup(email);
    const userId = await userIdOf(email);
    const reviewing = await seedRequest(userId, RequestStatus.REVIEWING);
    await seedRequest(userId, RequestStatus.IN_PROGRESS, {
      payment: PaymentStatus.PAID,
    });

    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password })
      .expect(409);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.email).toBe(email);
    expect(user.deletedAt).toBeNull();
    const still = await prisma.quoteRequest.findUniqueOrThrow({
      where: { id: reviewing },
    });
    expect(still.status).toBe(RequestStatus.REVIEWING);
  });

  it('탈퇴: 결제 없는 문의 삭제, 결제 있는 문의 보존·연락처 비움, 익명화, 세션·파일 정리, 재가입 가능', async () => {
    const email = `del-main-${stamp}@test.lunote.app`;
    const { accessToken, refreshToken } = await signup(email);
    const userId = await userIdOf(email);

    const reviewing = await seedRequest(userId, RequestStatus.REVIEWING);
    const quoted = await seedRequest(userId, RequestStatus.QUOTED, {
      quote: true,
    });
    const cancelled = await seedRequest(userId, RequestStatus.CANCELLED);
    const pendingPay = await seedRequest(userId, RequestStatus.QUOTED, {
      payment: PaymentStatus.PENDING,
    });
    const completed = await seedRequest(userId, RequestStatus.COMPLETED, {
      payment: PaymentStatus.PAID,
    });

    await prisma.notification.create({
      data: { userId, type: 'QUOTE_SENT', title: 't', body: 'b' },
    });
    // 관리자 알림(본문에 사용자 이메일)도 해당 문의를 가리키면 삭제돼야 한다
    const admin = await prisma.user.create({
      data: {
        email: `del-noti-admin-${stamp}@test.lunote.app`,
        provider: AuthProvider.EMAIL,
        role: 'ADMIN',
      },
    });
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'REQUEST_CREATED',
        title: `New request #${completed}`,
        body: `OTHER · ${email}`,
        requestId: completed,
      },
    });
    // 결제 불일치 관리자 알림은 환불 신호라 보존돼야 한다
    const mismatch = await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'PAYMENT_MISMATCH',
        title: `Payment mismatch #${completed}`,
        body: `request not in QUOTED status at payment time · payment ${randomUUID()}`,
        requestId: completed,
      },
    });

    // 실제 S3Mock 객체 — 정리 잡이 지우는지 확인
    const fileKey = `uploads/${userId}/${randomUUID()}/passport.jpg`;
    const body = Buffer.from('fake-image');
    const put = await fetch(
      await storage.presignUpload(fileKey, 'image/jpeg', body.length),
      { method: 'PUT', body, headers: { 'Content-Type': 'image/jpeg' } },
    );
    expect(put.ok).toBe(true);

    const res = await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password })
      .expect(200);
    expect(res.body).toEqual({ deleted: true });

    // 결제 행 없는 문의는 삭제
    const gone = await prisma.quoteRequest.findMany({
      where: { id: { in: [reviewing, quoted, cancelled] } },
    });
    expect(gone).toHaveLength(0);

    // 결제 행 있는 문의는 보존, QUOTED였던 건 CANCELLED, 연락처 비움, 첨부 행 없음
    const kept = await prisma.quoteRequest.findMany({
      where: { id: { in: [pendingPay, completed] } },
      include: { attachments: true, quote: { include: { payments: true } } },
      orderBy: { id: 'asc' },
    });
    expect(kept.map((r) => r.status)).toEqual([
      RequestStatus.CANCELLED,
      RequestStatus.COMPLETED,
    ]);
    for (const r of kept) {
      expect(r.contactMethod).toBe('');
      expect(r.attachments).toHaveLength(0);
      expect(r.quote?.payments).toHaveLength(1);
    }

    // 익명화
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.email).toBe(`deleted+${userId}@deleted.lunoteapp.invalid`);
    expect(user.deletedAt).not.toBeNull();
    expect(user.passwordHash).toBeNull();
    expect(user.firstName).toBeNull();
    expect(user.lastName).toBeNull();
    expect(user.avatarS3Key).toBeNull();

    // 알림(본인 + 관리자 것)·리프레시 토큰 삭제
    expect(
      await prisma.notification.count({
        where: {
          OR: [{ userId }, { requestId: completed, type: 'REQUEST_CREATED' }],
        },
      }),
    ).toBe(0);
    // PAYMENT_* 관리자 알림은 보존
    expect(
      await prisma.notification.findUnique({ where: { id: mismatch.id } }),
    ).not.toBeNull();
    expect(await prisma.refreshToken.count({ where: { userId } })).toBe(0);

    // 세션 즉시 무효
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    // S3 파일 영구 삭제 (BullMQ 워커)
    const deleted = await waitFor(async () => {
      const r = await fetch(await storage.presignDownload(fileKey));
      return r.status === 404;
    });
    expect(deleted).toBe(true);

    // 같은 이메일로 즉시 재가입 가능
    await signup(email);
  });

  describe('관리자 대행 삭제', () => {
    let adminToken: string;
    let customerToken: string;
    let adminId: string;

    beforeAll(async () => {
      const adminEmail = `del-admin-${stamp}@test.lunote.app`;
      await signup(adminEmail);
      adminId = await userIdOf(adminEmail);
      await prisma.user.update({
        where: { id: adminId },
        data: { role: 'ADMIN' },
      });
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password })
        .expect(200);
      adminToken = (login.body as { accessToken: string }).accessToken;
      customerToken = (await signup(`del-cust-${stamp}@test.lunote.app`))
        .accessToken;
    });

    it('일반 사용자는 관리자 사용자 API에 403', async () => {
      await request(app.getHttpServer())
        .post('/admin/users/lookup')
        .send({ email: `del-admin-${stamp}@test.lunote.app` })
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('이메일로 찾아 삭제 → 감사 로그, 관리자 문의 API에서 제외, 재삭제 404', async () => {
      const email = `del-target-${stamp}@test.lunote.app`;
      await signup(email);
      const targetId = await userIdOf(email);
      const kept = await seedRequest(targetId, RequestStatus.COMPLETED, {
        payment: PaymentStatus.PAID,
      });

      const found = await request(app.getHttpServer())
        .post('/admin/users/lookup')
        .send({ email })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const body = found.body as {
        id: string;
        role: string;
        createdAt: string;
      };
      expect(Object.keys(body).sort()).toEqual(['createdAt', 'id', 'role']);
      expect(body.id).toBe(targetId);
      expect(body.role).toBe('CUSTOMER');
      expect(typeof body.createdAt).toBe('string');

      await request(app.getHttpServer())
        .delete(`/admin/users/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const audit = await prisma.adminAuditLog.findFirst({
        where: { action: 'ACCOUNT_DELETED', targetId },
      });
      expect(audit?.adminId).toBe(adminId);

      // 보존 기록은 운영 API에서 분리(개인정보보호법 §21③)
      const list = await request(app.getHttpServer())
        .get('/admin/quote-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect((list.body as { id: number }[]).map((r) => r.id)).not.toContain(
        kept,
      );
      await request(app.getHttpServer())
        .get(`/admin/quote-requests/${kept}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // 익명화 후엔 원래 이메일로 못 찾고, 재삭제는 404
      await request(app.getHttpServer())
        .post('/admin/users/lookup')
        .send({ email })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/admin/users/${targetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('관리자 계정은 대행 삭제도 403', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const MAILPIT_API = 'http://localhost:8025/api/v1';

describe('Email verification (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const email = `verify-${stamp}@test.lunote.app`;
  const password = 'test-password-123';
  let token: string;

  /** Mailpit에서 이 사용자에게 온 최신 인증 코드 추출 */
  const fetchCode = async (): Promise<string | null> => {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const res = await fetch(
        `${MAILPIT_API}/search?query=${encodeURIComponent(email)}`,
      );
      const data = (await res.json()) as {
        messages: {
          ID: string;
          To: { Address: string }[] | null;
          Subject: string;
        }[];
      };
      const mine = data.messages.find(
        (m) =>
          (m.To ?? []).some((t) => t.Address === email) &&
          m.Subject.includes('verification code'),
      );
      if (mine) {
        const match = /(\d{6})/.exec(mine.Subject);
        if (match) return match[1];
      }
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

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    token = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('가입 직후 /auth/me에 emailVerifiedAt이 null', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      (res.body as { emailVerifiedAt: string | null }).emailVerifiedAt,
    ).toBeNull();
  });

  it('미인증 상태에서 문의 등록은 403 EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'OTHER',
        description: 'Trying before verifying my email address.',
        contactMethod: 'email: x@y.z',
      })
      .expect(403);
    expect((res.body as { code?: string }).code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('잘못된 코드는 400', () => {
    return request(app.getHttpServer())
      .post('/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' })
      .expect(400);
  });

  it('메일로 받은 코드로 인증 성공 → 문의 등록 가능', async () => {
    const code = await fetchCode();
    expect(code).not.toBeNull();

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: code! })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      (me.body as { emailVerifiedAt: string | null }).emailVerifiedAt,
    ).not.toBeNull();

    await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'OTHER',
        description: 'Now my email is verified — this should work.',
        contactMethod: 'email: x@y.z',
      })
      .expect(201);
  });

  it('이미 인증된 상태의 재인증은 멱등 (200)', () => {
    return request(app.getHttpServer())
      .post('/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' })
      .expect(200);
  });

  it('재발송 쿨다운: 가입 직후 1분 내 재요청은 400', async () => {
    // 새 계정으로 확인 (기존 계정은 이미 인증됨)
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: `verify2-${stamp}@test.lunote.app`, password })
      .expect(201);
    const t2 = (res.body as { accessToken: string }).accessToken;

    return request(app.getHttpServer())
      .post('/auth/resend-verification')
      .set('Authorization', `Bearer ${t2}`)
      .expect(400);
  });
});

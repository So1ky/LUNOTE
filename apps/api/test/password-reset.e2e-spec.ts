import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const MAILPIT_API = 'http://localhost:8025/api/v1';

describe('Password reset (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const email = `reset-${stamp}@test.lunote.app`;
  const password = 'original-password-1';
  const newPassword = 'brand-new-password-1';

  /** Mailpit에서 이 사용자에게 온 최신 재설정 코드 추출 */
  const fetchResetCode = async (): Promise<string | null> => {
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
          m.Subject.includes('password reset code'),
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

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('미가입 이메일도 동일하게 200 { sent: true } (존재 비노출)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `nobody-${stamp}@test.lunote.app` })
      .expect(200);
    expect(res.body).toEqual({ sent: true });
  });

  it('코드 발급 전 재설정 시도는 400', () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: '000000', newPassword })
      .expect(400);
  });

  it('가입 이메일로 요청 시 200 + 메일 발송', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);
    expect(res.body).toEqual({ sent: true });
  });

  it('틀린 코드는 400, 비밀번호 유지', async () => {
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: '000000', newPassword })
      .expect(400);

    // 기존 비밀번호로 여전히 로그인 가능
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
  });

  it('메일 코드로 재설정 성공 → 새 비밀번호로만 로그인 가능', async () => {
    const code = await fetchResetCode();
    expect(code).not.toBeNull();

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: code!, newPassword })
      .expect(200);

    // 기존 비밀번호는 거부
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    // 새 비밀번호로 로그인
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
  });

  it('사용된 코드 재사용은 400 (일회성)', async () => {
    const code = await fetchResetCode();
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: code!, newPassword: 'yet-another-password-1' })
      .expect(400);
  });

  it('발송 직후 1분 내 재요청은 쿨다운으로 조용히 스킵 (200 유지)', async () => {
    // 새 코드를 받고
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);
    // 쿨다운 중에도 응답은 동일 — 메일만 안 나간다
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);
    expect(res.body).toEqual({ sent: true });
  });
});

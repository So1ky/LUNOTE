import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// 로컬 docker compose의 PostgreSQL을 사용한다 (docker compose up -d 필요)
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  // 실행마다 유니크한 이메일 — 반복 실행해도 충돌 없음
  const email = `e2e-${Date.now()}@test.lunote.app`;
  const password = 'test-password-123';
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // main.ts와 동일한 파이프 설정 유지
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health — DB 연결 확인', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', db: 'up' });
  });

  it('POST /auth/signup — 가입하면 토큰 발급', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, name: 'E2E Tester' })
      .expect(201);
    expect((res.body as { accessToken?: string }).accessToken).toBeDefined();
  });

  it('POST /auth/signup — 중복 이메일은 409', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(409);
  });

  it('POST /auth/signup — 8자 미만 비밀번호는 400', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: `short-${email}`, password: 'short' })
      .expect(400);
  });

  it('POST /auth/login — 올바른 자격증명이면 토큰 발급', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    accessToken = (res.body as { accessToken: string }).accessToken;
    expect(accessToken).toBeDefined();
  });

  it('POST /auth/login — 틀린 비밀번호는 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('GET /auth/me — 토큰 없으면 401', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me — 토큰 있으면 내 정보 반환', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = res.body as { email: string; passwordHash?: string };
    expect(body.email).toBe(email);
    expect(body.passwordHash).toBeUndefined(); // 해시는 절대 노출 금지
  });
});

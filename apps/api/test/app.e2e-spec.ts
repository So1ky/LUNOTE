import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
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
    // main.ts와 동일한 설정 유지 (테스트는 비프로덕션이므로 hsts off)
    app.use(helmet({ hsts: false }));
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
      .expect({ status: 'ok', db: 'up', queue: 'up' });
  });

  it('POST /auth/signup — 가입하면 토큰 발급', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, firstName: 'E2E', lastName: 'Tester' })
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

  it('보안 헤더(helmet)가 응답에 포함된다', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined(); // 기술스택 노출 제거
    // HSTS는 프로덕션 전용 — 로컬에 보내면 브라우저가 localhost를 https로 강제 전환해버린다
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });

  it('로그인 무차별 대입은 rate limit(429)으로 차단된다', async () => {
    const target = `brute-${Date.now()}@test.lunote.app`;
    const codes: number[] = [];
    // 카운터는 IP 단위라 앞선 로그인 테스트의 소비분이 남아 있다.
    // 정확한 횟수 대신 "결국 차단되고, 한번 차단되면 계속 차단된다"는 속성을 검증한다.
    for (let i = 0; i < 12; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: target, password: `guess-${i}` });
      codes.push(res.status);
    }

    const firstBlocked = codes.indexOf(429);
    expect(firstBlocked).toBeGreaterThanOrEqual(0); // 차단이 실제로 발생
    expect(codes.slice(firstBlocked).every((c) => c === 429)).toBe(true); // 이후 계속 차단
    expect(codes.every((c) => c === 401 || c === 429)).toBe(true); // 인증 우회 없음
  });
});

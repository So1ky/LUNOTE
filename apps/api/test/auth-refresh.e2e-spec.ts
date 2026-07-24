import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/** 리프레시 토큰 회전·재사용 탐지·세션 폐기 (ARCHITECTURE §11) */
describe('Auth refresh tokens (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const email = `refresh-${stamp}@test.lunote.app`;
  const password = 'test-password-123';
  let access: string;
  let refresh: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('가입하면 access + refresh 쌍이 발급된다', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toHaveLength(96);
    access = body.accessToken;
    refresh = body.refreshToken;
  });

  it('refresh → 새 쌍 발급 (회전)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh })
      .expect(200);
    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.refreshToken).not.toBe(refresh);
    // 새 액세스 토큰이 유효한지 확인
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    const old = refresh;
    refresh = body.refreshToken;
    access = body.accessToken;
    // 회전된(폐기된) 이전 토큰 재사용 → 401 + 전 세션 폐기
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: old })
      .expect(401);
  });

  it('재사용 탐지 후에는 최신 토큰도 폐기되어 있다 (전 세션 무효화)', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh })
      .expect(401);
  });

  it('재로그인 → logout하면 해당 refresh는 더 못 쓴다', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const pair = login.body as { accessToken: string; refreshToken: string };

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: pair.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: pair.refreshToken })
      .expect(401);
    access = pair.accessToken;
  });

  it('비밀번호를 변경하면 다른 기기의 refresh도 무효화된다', async () => {
    // 기기 A(현재) + 기기 B(별도 로그인) 세션 두 개
    const deviceB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const bRefresh = (deviceB.body as { refreshToken: string }).refreshToken;

    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${access}`)
      .send({ currentPassword: password, newPassword: 'new-password-456!' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: bRefresh })
      .expect(401);
  });
});

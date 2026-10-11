import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Push tokens (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const password = 'test-password-123';
  const tokenA = `ExponentPushToken[a-${stamp}]`;
  let userA: string;
  let userB: string;

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, termsAccepted: true })
      .expect(201);
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
    // 이메일 미인증 상태 그대로 — 푸시 등록은 JwtAuthGuard만 요구한다
    userA = await signup(`push-a-${stamp}@test.lunote.app`);
    userB = await signup(`push-b-${stamp}@test.lunote.app`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT /users/me/push-token — 204, 행 생성', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: tokenA, platform: 'IOS' })
      .expect(204);
    const row = await prisma.pushToken.findUniqueOrThrow({
      where: { token: tokenA },
    });
    expect(row.platform).toBe('IOS');
  });

  it('같은 토큰 재PUT — 행 1개, lastSeenAt 갱신', async () => {
    const before = await prisma.pushToken.findUniqueOrThrow({
      where: { token: tokenA },
    });
    await new Promise((r) => setTimeout(r, 20));
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: tokenA, platform: 'IOS' })
      .expect(204);
    const rows = await prisma.pushToken.findMany({ where: { token: tokenA } });
    expect(rows).toHaveLength(1);
    expect(rows[0].lastSeenAt.getTime()).toBeGreaterThan(
      before.lastSeenAt.getTime(),
    );
  });

  it('다른 사용자가 같은 토큰을 PUT — userId가 옮겨간다 (기기 공유·재로그인)', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userB}`)
      .send({ token: tokenA, platform: 'IOS' })
      .expect(204);
    const row = await prisma.pushToken.findUniqueOrThrow({
      where: { token: tokenA },
      include: { user: true },
    });
    expect(row.user.email).toBe(`push-b-${stamp}@test.lunote.app`);
  });

  it('잘못된 형식·플랫폼은 400', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: 'not-a-token', platform: 'IOS' })
      .expect(400);
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: tokenA, platform: 'WEB' })
      .expect(400);
  });

  it('200자를 넘는 토큰은 400', async () => {
    const long = `ExponentPushToken[${'a'.repeat(201 - 'ExponentPushToken[]'.length)}]`;
    expect(long).toHaveLength(201);
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: long, platform: 'IOS' })
      .expect(400);
  });

  it('미인증은 401', async () => {
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .send({ token: tokenA, platform: 'IOS' })
      .expect(401);
  });

  it('DELETE — 본인 토큰만 지운다 (남의 토큰은 204지만 유지)', async () => {
    await request(app.getHttpServer())
      .delete('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: tokenA })
      .expect(204);
    expect(await prisma.pushToken.count({ where: { token: tokenA } })).toBe(1); // B 소유라 그대로
    await request(app.getHttpServer())
      .delete('/users/me/push-token')
      .set('Authorization', `Bearer ${userB}`)
      .send({ token: tokenA })
      .expect(204);
    expect(await prisma.pushToken.count({ where: { token: tokenA } })).toBe(0);
  });

  it('비밀번호 변경(전 세션 폐기) 시 그 사용자의 토큰 행도 삭제된다', async () => {
    const tokenC = `ExpoPushToken[c-${stamp}]`;
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userA}`)
      .send({ token: tokenC, platform: 'IOS' })
      .expect(204);
    expect(
      await prisma.pushToken.count({
        where: { user: { email: `push-a-${stamp}@test.lunote.app` } },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${userA}`)
      .send({ currentPassword: password, newPassword: 'next-password-123' })
      .expect(200);
    expect(
      await prisma.pushToken.count({
        where: { user: { email: `push-a-${stamp}@test.lunote.app` } },
      }),
    ).toBe(0);
  });

  it('계정 삭제 시 토큰 행도 삭제된다', async () => {
    const tokenB = `ExponentPushToken[b-${stamp}]`;
    await request(app.getHttpServer())
      .put('/users/me/push-token')
      .set('Authorization', `Bearer ${userB}`)
      .send({ token: tokenB, platform: 'ANDROID' })
      .expect(204);
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${userB}`)
      .send({ password })
      .expect(200);
    expect(await prisma.pushToken.count({ where: { token: tokenB } })).toBe(0);
  });
});

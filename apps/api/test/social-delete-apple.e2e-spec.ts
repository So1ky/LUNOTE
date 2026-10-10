import {
  INestApplication,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, Category, RequestStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppleAuthClient } from './../src/auth/social/apple-auth.client';
import { AppleTokenVerifier } from './../src/auth/social/apple-token.verifier';
import { GoogleTokenVerifier } from './../src/auth/social/google-token.verifier';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  fakeAppleVerifier,
  fakeGoogleVerifier,
  fakeToken,
} from './support/fake-social';

describe('Social account deletion — Apple (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const appleAuth = { exchangeCode: jest.fn(), revoke: jest.fn() };

  const join = async (sub: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/apple')
      .send({
        identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
      })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };
  const del = (accessToken: string, sub: string) =>
    request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        identityToken: fakeToken(sub),
        authorizationCode: `code-${sub}`,
      });
  const userOf = (sub: string) =>
    prisma.user.findFirst({
      where: { provider: AuthProvider.APPLE, providerId: sub },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleTokenVerifier)
      .useValue(fakeGoogleVerifier)
      .overrideProvider(AppleTokenVerifier)
      .useValue(fakeAppleVerifier)
      .overrideProvider(AppleAuthClient)
      .useValue(appleAuth)
      .compile();
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
  });

  beforeEach(() => {
    appleAuth.exchangeCode.mockReset().mockImplementation((code: string) =>
      Promise.resolve({
        refreshToken: 'apple-refresh',
        sub: code.replace(/^code-/, ''),
      }),
    );
    appleAuth.revoke.mockReset().mockResolvedValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('성공 → code 교환 후 삭제, 교환한 토큰으로 revoke', async () => {
    const sub = `ad-ok-${stamp}`;
    const token = await join(sub);
    await del(token, sub).expect(200);
    expect(appleAuth.exchangeCode).toHaveBeenCalledWith(`code-${sub}`);
    // revoke는 응답 이후 백그라운드 — 호출될 때까지 잠시 대기
    for (let i = 0; i < 50 && appleAuth.revoke.mock.calls.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(appleAuth.revoke).toHaveBeenCalledWith('apple-refresh');
    expect(await userOf(sub)).toBeNull(); // providerId 익명화
  });

  it('code 교환 실패(Apple 장애) → 503, 계정 그대로, revoke 안 함', async () => {
    appleAuth.exchangeCode.mockRejectedValueOnce(
      new ServiceUnavailableException(),
    );
    const sub = `ad-down-${stamp}`;
    const token = await join(sub);
    await del(token, sub).expect(503);
    expect((await userOf(sub))?.deletedAt).toBeNull();
    expect(appleAuth.revoke).not.toHaveBeenCalled();
  });

  it('결제 진행 중 → 409, revoke 안 함 (Apple 연결 유지)', async () => {
    const sub = `ad-paid-${stamp}`;
    const token = await join(sub);
    const user = await userOf(sub);
    await prisma.quoteRequest.create({
      data: {
        userId: user!.id,
        category: Category.OTHER,
        description: 'paid seed',
        contactMethod: 'kakao: seed',
        status: RequestStatus.PAID,
      },
    });
    await del(token, sub).expect(409);
    expect(appleAuth.revoke).not.toHaveBeenCalled();
  });

  it('revoke 최종 실패 → 그래도 200 (계정은 삭제됨)', async () => {
    appleAuth.revoke.mockResolvedValueOnce(false);
    const sub = `ad-revokefail-${stamp}`;
    const token = await join(sub);
    await del(token, sub).expect(200);
    expect(await userOf(sub)).toBeNull();
  });

  it('authorizationCode 없으면 400', async () => {
    const sub = `ad-nocode-${stamp}`;
    const token = await join(sub);
    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ identityToken: fakeToken(sub) })
      .expect(400);
  });
});

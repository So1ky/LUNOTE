import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppleTokenVerifier } from './../src/auth/social/apple-token.verifier';
import { GoogleTokenVerifier } from './../src/auth/social/google-token.verifier';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  fakeAppleVerifier,
  fakeGoogleVerifier,
  fakeToken,
} from './support/fake-social';

describe('Apple server-to-server notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();

  const join = async (sub: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/apple')
      .send({
        identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
      })
      .expect(200);
    return res.body as { accessToken: string; refreshToken: string };
  };
  const notify = (payload: string) =>
    request(app.getHttpServer())
      .post('/auth/apple/notifications')
      .send({ payload });
  const refresh = (refreshToken: string) =>
    request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleTokenVerifier)
      .useValue(fakeGoogleVerifier)
      .overrideProvider(AppleTokenVerifier)
      .useValue(fakeAppleVerifier)
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

  afterAll(async () => {
    await app.close();
  });

  it('consent-revoked → 200, 해당 사용자의 refresh token 전부 무효화', async () => {
    const sub = `an-consent-${stamp}`;
    const { refreshToken } = await join(sub);
    const res = await notify(`fake|consent-revoked|${sub}`).expect(200);
    expect(res.body).toEqual({ ok: true });
    await refresh(refreshToken).expect(401);
  });

  it('account-delete → 200, 계정 익명화', async () => {
    const sub = `an-delete-${stamp}`;
    await join(sub);
    await notify(`fake|account-delete|${sub}`).expect(200);
    expect(
      await prisma.user.findFirst({
        where: { provider: AuthProvider.APPLE, providerId: sub },
      }),
    ).toBeNull();
  });

  it('위조된 payload → 400', async () => {
    await notify('not-fake').expect(400);
  });

  it('알 수 없는 sub → 200 (Apple 재전송 방지)', async () => {
    await notify(`fake|consent-revoked|unknown-${stamp}`).expect(200);
  });
});

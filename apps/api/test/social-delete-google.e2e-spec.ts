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

describe('Social account deletion — Google (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();

  /** Google 가입 → accessToken */
  const join = async (sub: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/google')
      .send({
        idToken: fakeToken(sub, `${sub}@gmail.test`),
        termsAccepted: true,
      })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  };
  const del = (accessToken: string, body: Record<string, string>) =>
    request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body);
  /** 행이 없으면(providerId 익명화) 'anonymized', 있으면 deletedAt(null이면 그대로) */
  const deletedAt = async (sub: string) => {
    const user = await prisma.user.findFirst({
      where: { provider: AuthProvider.GOOGLE, providerId: sub },
    });
    return user ? user.deletedAt : 'anonymized';
  };

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

  it('같은 계정으로 방금 재인증 → 200, 익명화', async () => {
    const sub = `gd-ok-${stamp}`;
    const token = await join(sub);
    await del(token, { idToken: fakeToken(sub, `${sub}@gmail.test`) }).expect(
      200,
    );
    // 탈퇴 시 providerId가 null이 되므로 sub로는 더 이상 찾을 수 없다
    expect(await deletedAt(sub)).toBe('anonymized');
  });

  it('다른 Google 계정으로 재인증 → 400, 그대로', async () => {
    const sub = `gd-other-${stamp}`;
    const token = await join(sub);
    await del(token, {
      idToken: fakeToken(`someone-else-${stamp}`, 'x@gmail.test'),
    }).expect(400);
    expect(await deletedAt(sub)).toBeNull();
  });

  it('5분 넘은 토큰 → 400', async () => {
    const sub = `gd-stale-${stamp}`;
    const token = await join(sub);
    await del(token, {
      idToken: fakeToken(sub, `${sub}@gmail.test`, 600),
    }).expect(400);
    expect(await deletedAt(sub)).toBeNull();
  });

  it('Google 가입자가 비밀번호로 시도 → 400', async () => {
    const sub = `gd-pw-${stamp}`;
    const token = await join(sub);
    await del(token, { password: 'whatever-123' }).expect(400);
    expect(await deletedAt(sub)).toBeNull();
  });
});

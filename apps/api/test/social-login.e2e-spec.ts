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

describe('Social login (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();

  const google = (idToken: string) =>
    request(app.getHttpServer()).post('/auth/google').send({ idToken });
  const apple = (body: Record<string, string>) =>
    request(app.getHttpServer()).post('/auth/apple').send(body);
  const me = (accessToken: string) =>
    request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

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

  it('Google 신규 → 200, 이메일 인증 완료·비밀번호 없음으로 생성', async () => {
    const sub = `g-new-${stamp}`;
    const res = await google(fakeToken(sub, `${sub}@gmail.test`)).expect(200);
    expect(res.body).toEqual({
      accessToken: expect.any(String) as string,
      refreshToken: expect.any(String) as string,
    });
    const user = await prisma.user.findFirstOrThrow({
      where: { provider: AuthProvider.GOOGLE, providerId: sub },
    });
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.passwordHash).toBeNull();
  });

  it('같은 Google 계정 재로그인 → 같은 사용자, /auth/me에 provider', async () => {
    const sub = `g-again-${stamp}`;
    const first = await google(fakeToken(sub, `${sub}@gmail.test`)).expect(200);
    const second = await google(fakeToken(sub, `${sub}@gmail.test`)).expect(
      200,
    );
    const me1 = (await me((first.body as { accessToken: string }).accessToken))
      .body as { id: string };
    const me2 = (await me((second.body as { accessToken: string }).accessToken))
      .body as { id: string; provider: string };
    expect(me2.id).toBe(me1.id);
    expect(me2.provider).toBe('GOOGLE');
  });

  it('이메일 가입자와 같은 이메일 → 409 + 기존 provider', async () => {
    const email = `dup-${stamp}@test.lunote.app`;
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password: 'test-password-123' })
      .expect(201);
    const res = await google(fakeToken(`g-dup-${stamp}`, email)).expect(409);
    expect(res.body).toMatchObject({
      code: 'EMAIL_REGISTERED',
      provider: 'EMAIL',
    });
  });

  it('검증 실패 토큰 → 400', async () => {
    await google('bad-token').expect(400);
  });

  it('Apple 최초 로그인은 본문 이름 저장, 재로그인 이름은 덮어쓰지 않음', async () => {
    const sub = `a-name-${stamp}`;
    await apple({
      identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
      firstName: 'Mina',
      lastName: 'Kim',
    }).expect(200);
    await apple({
      identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
      firstName: 'Other',
    }).expect(200);
    const user = await prisma.user.findFirstOrThrow({
      where: { provider: AuthProvider.APPLE, providerId: sub },
    });
    expect(user).toMatchObject({ firstName: 'Mina', lastName: 'Kim' });
  });

  it('Apple 재로그인 토큰에 이메일이 없어도 기존 사용자는 로그인', async () => {
    const sub = `a-noemail-${stamp}`;
    await apple({
      identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
    }).expect(200);
    await apple({ identityToken: fakeToken(sub) }).expect(200);
  });

  it('신규인데 이메일이 없으면 400', async () => {
    await apple({ identityToken: fakeToken(`a-none-${stamp}`) }).expect(400);
  });

  it('같은 계정 동시 가입 → 둘 다 200, 사용자 1명', async () => {
    const sub = `g-race-${stamp}`;
    const [a, b] = await Promise.all([
      google(fakeToken(sub, `${sub}@gmail.test`)),
      google(fakeToken(sub, `${sub}@gmail.test`)),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(
      await prisma.user.count({
        where: { provider: AuthProvider.GOOGLE, providerId: sub },
      }),
    ).toBe(1);
  });
});
